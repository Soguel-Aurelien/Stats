package stats

object Main:
  def main(args: Array[String]): Unit =
    val port = sys.env.get("PORT").fold(8080)(_.toInt)
    val host = sys.env.getOrElse("HOST", "0.0.0.0")
    val app = new StatsServer(host, port)
    sys.addShutdownHook(app.stop())
    app.start()
    println(s"Stats läuft auf http://localhost:${app.port} (Demodaten)")
