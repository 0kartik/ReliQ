import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace } from "@opentelemetry/api";

const serviceName = process.env.OTEL_SERVICE_NAME || "reliablequeue";

const provider = new NodeTracerProvider({
  resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),
});

// Console exporter for demo visibility. Swap for OTLPTraceExporter pointed at
// a real Jaeger collector in production — same span API, zero code changes.
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

export const tracer = trace.getTracer(serviceName);

// Convenience wrapper: runs fn inside a span, returns fn's result, records errors
export async function withSpan(name, attributes, fn) {
  const span = tracer.startSpan(name, { attributes });
  try {
    const result = await fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: 2, message: err.message }); // ERROR
    throw err;
  } finally {
    span.end();
  }
}

export function getTraceId(span) {
  return span.spanContext().traceId;
}
