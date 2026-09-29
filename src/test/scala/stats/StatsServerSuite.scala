package stats

import java.net.URI
import java.net.http.{HttpClient, HttpRequest, HttpResponse}

class StatsServerSuite extends munit.FunSuite:
  private val client = HttpClient.newHttpClient()
  private def withServer(test: String => Unit): Unit =
    val server = new StatsServer("127.0.0.1", 0)
    server.start()
    try test(s"http://127.0.0.1:${server.port}")
    finally server.stop()

  private def get(base: String, path: String) =
    client.send(HttpRequest.newBuilder(URI.create(base + path)).GET().build(), HttpResponse.BodyHandlers.ofString())

  test("serves the interactive dashboard, scripts and sourced data") {
    withServer { base =>
      val html = get(base, "/")
      assertEquals(html.statusCode(), 200)
      assert(html.body().contains("Scorer"))
      assert(html.body().contains("Assists"))
      assert(html.body().contains("Testdaten"))
      assert(html.body().contains("data-view=\"standings\" aria-pressed=\"true\""))
      assert(html.body().contains("type=\"module\""))
      assert(get(base, "/app.js").headers().firstValue("Content-Type").get().startsWith("text/javascript"))
      assertEquals(get(base, "/rankings.js").statusCode(), 200)
      assertEquals(get(base, "/data/stats.json").statusCode(), 200)
      val standings = get(base, "/data/standings.json")
      assertEquals(standings.statusCode(), 200)
      assert(standings.body().contains("\"mode\": \"test\""))
      assert(html.headers().firstValue("Content-Security-Policy").get().contains("connect-src 'self'"))
      assertEquals(get(base, "/index.html").body(), html.body())
      assert(get(base, "/styles.css").headers().firstValue("Content-Type").get().startsWith("text/css"))
      assertEquals(get(base, "/favicon.svg").statusCode(), 200)
    }
  }

  test("removed API and private resources are not available") {
    withServer { base =>
      for path <- List("/api/v1/dashboard", "/health", "/data/dashboard.json", "/../build.sbt", "/%2e%2e/build.sbt") do
        assertEquals(get(base, path).statusCode(), 404)
    }
  }

  test("HEAD returns headers without body; writes are rejected") {
    withServer { base =>
      val head = client.send(HttpRequest.newBuilder(URI.create(base + "/")).method("HEAD", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString())
      assertEquals(head.statusCode(), 200)
      assertEquals(head.body(), "")
      val post = client.send(HttpRequest.newBuilder(URI.create(base + "/")).POST(HttpRequest.BodyPublishers.ofString("test")).build(), HttpResponse.BodyHandlers.ofString())
      assertEquals(post.statusCode(), 405)
      assertEquals(post.headers().firstValue("Allow").get(), "GET, HEAD")
    }
  }
