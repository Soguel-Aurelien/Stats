package stats

import com.sun.net.httpserver.{HttpExchange, HttpServer}
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets.UTF_8
import java.util.concurrent.Executors

/** Static file server for the dashboard and its saved, sourced statistics. */
final class StatsServer(host: String, requestedPort: Int):
  private val server = HttpServer.create(new InetSocketAddress(host, requestedPort), 0)
  private val executor = Executors.newFixedThreadPool(4)
  private val assets = Map(
    "/" -> ("/public/index.html", "text/html; charset=utf-8"),
    "/index.html" -> ("/public/index.html", "text/html; charset=utf-8"),
    "/styles.css" -> ("/public/styles.css", "text/css; charset=utf-8"),
    "/favicon.svg" -> ("/public/favicon.svg", "image/svg+xml"),
    "/app.js" -> ("/public/app.js", "text/javascript; charset=utf-8"),
    "/rankings.js" -> ("/public/rankings.js", "text/javascript; charset=utf-8"),
    "/data/stats.json" -> ("/public/data/stats.json", "application/json; charset=utf-8")
  )
  server.setExecutor(executor)
  server.createContext("/", (exchange: HttpExchange) => handle(exchange))

  def port: Int = server.getAddress.getPort
  def start(): Unit = server.start()
  def stop(): Unit =
    server.stop(0)
    executor.shutdownNow()

  private def respond(exchange: HttpExchange, status: Int, contentType: String, bytes: Array[Byte]): Unit =
    val headers = exchange.getResponseHeaders
    headers.set("Content-Type", contentType)
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' https://a.espncdn.com https://origins-sportlab-payload-s3.origins-digital.com; base-uri 'none'; frame-ancestors 'none'")
    headers.set("Cache-Control", "no-store")
    if exchange.getRequestMethod == "HEAD" then exchange.sendResponseHeaders(status, -1)
    else
      exchange.sendResponseHeaders(status, bytes.length.toLong)
      exchange.getResponseBody.write(bytes)

  private def handle(exchange: HttpExchange): Unit =
    try
      if !Set("GET", "HEAD").contains(exchange.getRequestMethod) then
        exchange.getResponseHeaders.set("Allow", "GET, HEAD")
        respond(exchange, 405, "text/plain; charset=utf-8", "Methode nicht erlaubt".getBytes(UTF_8))
      else
        val asset = assets.get(exchange.getRequestURI.getPath)
        asset.flatMap { case (path, contentType) =>
          Option(getClass.getResourceAsStream(path)).map(input => (input, contentType))
        } match
          case Some((input, contentType)) =>
            try respond(exchange, 200, contentType, input.readAllBytes())
            finally input.close()
          case None => respond(exchange, 404, "text/plain; charset=utf-8", "Nicht gefunden".getBytes(UTF_8))
    finally exchange.close()
