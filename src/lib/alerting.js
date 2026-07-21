import { config } from "../config.js";
import { logger } from "./logger.js";

export async function sendDlqAlert(job) {
  if (!config.alerting.slackWebhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured — skipping DLQ alert");
    return;
  }

  const message = {
    text: `🚨 *Job moved to Dead Letter Queue*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `🚨 *Job moved to Dead Letter Queue*\n` +
            `*Job ID:* \`${job.job_id}\`\n` +
            `*Type:* ${job.job_type}\n` +
            `*Retries:* ${job.retry_count}\n` +
            `*Reason:* ${job.dlq_reason}\n` +
            `*Time:* ${job.dlq_at}`,
        },
      },
    ],
  };

  try {
    const res = await fetch(config.alerting.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "Slack alert failed to send");
    } else {
      logger.info({ job_id: job.job_id }, "Slack DLQ alert sent");
    }
  } catch (err) {
    logger.error({ err: err.message }, "Slack alert request failed");
  }
}