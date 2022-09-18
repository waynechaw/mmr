var express = require('express');
var app = express();
const request = require('request');

let rankToMMR = {
  DIAMOND1:2480,
  DIAMOND2:2410,
  DIAMOND3:2270,
  DIAMOND4:2200,
  PLATINUM1:2130,
  PLATINUM2:2060,
  PLATINUM3:1990,
  PLATINUM4 :1920,
  GOLD1:1780,
  GOLD2:1710,
  GOLD3:1640,
  GOLD4:1570,
  SILVER1:1430,
  SILVER2:1360,
  SILVER3:1290,
  SILVER4:1220,
  BRONZE1:1080,
  BRONZE2:1010,
  BRONZE3:940,
  BRONZE4:870,
  IRON1:700,
  IRON2:700,
  IRON3:700,
  IRON4:700
}

app.get('/mmr', function (req, res) {

  res.send('name missing');
})


app.get('/mmr/:name', function (req, res) {

  if (req.params.name) {
    request(`https://na.op.gg/summoners/na/${req.params.name}`, function (error, response, body) {

      let opggdata = body;
      var testRE = opggdata.match(/"summoner_id":"(.*?)","acct_id/);
      let encryptedID = testRE[1];

      request(`https://na.op.gg/api/games/na/summoners/${encryptedID}?hl=en_US&game_type=NORMAL`, function (error, response, body) {

        let jsonData = JSON.parse(body);
        console.log(99999, JSON.stringify(jsonData.data));
        jsonData.data = jsonData.data.filter(match => match.average_tier_info);
        let recentMatchesTiers = jsonData.data.map(match => match.average_tier_info.tier + match.average_tier_info.division);
        let recentMatchesAvgMMR = jsonData.data.map(match => rankToMMR[match.average_tier_info.tier + match.average_tier_info.division]).reduce((a, b) => a + b)/jsonData.data.length;


        let mmrRows = '';

        for (const property in rankToMMR) {
          mmrRows = mmrRows + `
            <tr>
              <td>${property}</td>
              <td>${rankToMMR[property]}</td>
            </tr>
          `;
        }

        res.send(`

          <div><b>Name: </b> ${req.params.name}</div>
          <div><b>Recent Matches Avg MMR: </b> ${recentMatchesAvgMMR}</div>
          <div><b>Number of Matches Analyzed: </b> ${jsonData.data.length}</div>
          <div><b>Recent Matches Tiers: </b> ${recentMatchesTiers}</div>

          <br><br>



          <p>the result uses below table to convert rank to mmr. this is mostly a guess, contact wayne to improve this table</p>
          <table>
            <tr>
              <th>Rank</th>
              <th>MMR</th>
            </tr>
            ${mmrRows}
          </table>



        `);

        // res.json({
        //   user: req.params.name,
        //   recentMatchesAvgMMR: recentMatchesAvgMMR,
        //   numberOfMatchesAnalyzed: jsonData.data.length,
        //   recentMatchesTiers: recentMatchesTiers,
        //   rankToMMR: rankToMMR,
        // });

      });


    });
  } else {
    res.send('name missing');
  }




})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})