package stats

import java.nio.file.Files

class CSVDataSuite extends munit.FunSuite:
  test("CSV file loads and groups players by league") {
    val file = new java.io.File("players.csv")
    val result = Data.loadPlayers(file.getAbsolutePath)

    assert(result.isRight)
    val players = result.toOption.get
    assert(players.nonEmpty)
    assert(players.size == 854)
    val leagues = Data.groupByLeague(players)
    assert(leagues.nonEmpty)
    assert(leagues.exists(_.id == "eng.1"))
    assert(leagues.find(_.id == "eng.1").exists(_.players.nonEmpty))
  }

  test("missing CSV file is reported clearly") {
    val path = java.nio.file.Paths.get("does-not-exist.csv")
    val result = Data.loadPlayers(path.toString)
    assert(result.isLeft)
    assert(result.left.toOption.exists(_.contains("nicht gefunden")))
  }
