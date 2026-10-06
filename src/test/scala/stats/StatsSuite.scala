package stats



class StatsSuite extends munit.FunSuite:
  test("saved changes survive reloading and preserve other players and Unicode") {
    val file = java.nio.file.Files.createTempFile("stats-save", ".csv")
    try {
      val players = Vector(
        Player("eng.1_João Pedro_Chelsea", "João Pedro", "Chelsea", "eng.1", "Premier League", 3, 3),
        Player("ger.1_Test_Köln", "Test", "Köln", "ger.1", "Bundesliga", 2, 1)
      )
      assertEquals(Data.savePlayers(file.toString, players), Right(()))
      val changed = players.updated(0, Model.updateStats(players.head, 10, 3))
      assertEquals(Data.savePlayers(file.toString, changed), Right(()))
      assertEquals(Data.loadPlayers(file.toString), Right(changed))
      assertEquals(players.head.goals, 3)
      val saved = java.nio.file.Files.readString(file)
      assert(Data.savePlayers(file.toString, changed.updated(0, changed.head.copy(goals = -1))).isLeft)
      assert(Data.savePlayers(file.toString, changed.updated(0, changed.head.copy(name = "Bad,Name"))).isLeft)
      assertEquals(java.nio.file.Files.readString(file), saved)
    } finally java.nio.file.Files.deleteIfExists(file)
  }

  test("save failures leave existing destinations untouched") {
    val directory = java.nio.file.Files.createTempDirectory("stats-save-error")
    val marker = directory.resolve("keep.txt")
    java.nio.file.Files.writeString(marker, "original")
    try {
      val player = Player("x_Test_Team", "Test", "Team", "x", "Liga", 1, 0)
      assert(Data.savePlayers(directory.toString, Vector(player)).isLeft)
      assertEquals(java.nio.file.Files.readString(marker), "original")
    } finally {
      java.nio.file.Files.deleteIfExists(marker)
      java.nio.file.Files.deleteIfExists(directory)
    }
  }

  test("topPlayers sorts by goals descending") {
    val players = Vector(
      Player("eng.1_1", "Erling Haaland", "Manchester City", "eng.1", "Premier League", 5, 0),
      Player("eng.1_2", "Pascal Gross", "Brighton & Hove Albion", "eng.1", "Premier League", 3, 3),
      Player("eng.1_3", "Bruno Fernandes", "Manchester United", "eng.1", "Premier League", 2, 5)
    )

    val ranking = Model.topPlayers(players, "goals", 10)
    assertEquals(ranking.head.name, "Erling Haaland")
    assertEquals(ranking.map(_.name), Vector("Erling Haaland", "Pascal Gross", "Bruno Fernandes"))
  }

  test("topPlayers sorts by scorer points and then goals") {
    val players = Vector(
      Player("eng.1_1", "A", "Team A", "eng.1", "Premier League", 2, 2),
      Player("eng.1_2", "B", "Team B", "eng.1", "Premier League", 3, 0),
      Player("eng.1_3", "C", "Team C", "eng.1", "Premier League", 1, 5)
    )

    val ranking = Model.topPlayers(players, "scorer", 10)
    assertEquals(ranking.map(_.name), Vector("C", "A", "B"))
  }

  test("searchPlayers finds names and teams case-insensitively") {
    val players = Vector(
      Player("eng.1_1", "Erling Haaland", "Manchester City", "eng.1", "Premier League", 5, 0),
      Player("eng.1_2", "Bruno Fernandes", "Manchester United", "eng.1", "Premier League", 2, 5),
      Player("eng.1_3", "Kevin Schade", "Brentford", "eng.1", "Premier League", 3, 0)
    )

    val matches = Model.searchPlayers(players, "city")
    assertEquals(matches.size, 1)
    assertEquals(matches.head.name, "Erling Haaland")

    val matchesByName = Model.searchPlayers(players, "bruno")
    assertEquals(matchesByName.head.name, "Bruno Fernandes")
  }

  test("updates create new immutable player instances") {
    val player = Player("eng.1_1", "Erling Haaland", "Manchester City", "eng.1", "Premier League", 5, 0)
    val next = Model.updateStats(player, 7, 2)

    assertEquals(player.goals, 5)
    assertEquals(player.assists, 0)
    assertEquals(next.goals, 7)
    assertEquals(next.assists, 2)
    assertEquals(next.scorerPoints, 9)
  }

  test("CSV loader rejects invalid header and row data") {
    val tempFile = java.nio.file.Files.createTempFile("football-stats", ".csv")
    tempFile.toFile.deleteOnExit()
    java.nio.file.Files.writeString(tempFile, "leagueId,leagueName,playerName,team,goals,assists\neng.1,Premier League,Test,Team,abc,1\n")

    val result = Data.loadPlayers(tempFile.toString)
    assert(result.isLeft)
    assert(result.left.toOption.exists(_.contains("Tore ist ungültig")))

    val invalidHeader = java.nio.file.Files.createTempFile("football-stats-bad-header", ".csv")
    invalidHeader.toFile.deleteOnExit()
    java.nio.file.Files.writeString(invalidHeader, "wrong,header\n")
    val invalidHeaderResult = Data.loadPlayers(invalidHeader.toString)
    assert(invalidHeaderResult.isLeft)
  }

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
