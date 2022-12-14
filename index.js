const express = require("express");
const request = require("request");
const app = express();
var bodyParser = require('body-parser')
const port = process.env.PORT || 3001;
app.use(bodyParser.urlencoded({ extended: true }));

let rankToMMR = {
  CHALLENGER: 9001,
  GRANDMASTER1: 3100,
  MASTER1: 3000,
  DIAMOND1:2700,
  DIAMOND2:2600,
  DIAMOND3:2500,
  DIAMOND4:2400,
  PLATINUM1:2300,
  PLATINUM2:2200,
  PLATINUM3:2100,
  PLATINUM4 :2000,
  GOLD1:1900,
  GOLD2:1800,
  GOLD3:1700,
  GOLD4:1600,
  SILVER1:1500,
  SILVER2:1400,
  SILVER3:1300,
  SILVER4:1200,
  BRONZE1:1100,
  BRONZE2:1000,
  BRONZE3:900,
  BRONZE4:880,
  IRON1:700,
  IRON2:600,
  IRON3:500,
  IRON4:400
}

app.get('/mmr', function (req, res) {


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

    <h1>Simple MMR Checker</h1>

    <p>This tool checks user's MMR in normals. Currently only works for NA. <br> 
    To get the most accurate mmr, <b>play 20 games solo in normals</b>. Queueing with other players will cause inaccurate result.<br>
    The tool uses below table to convert rank to mmr. This is mostly a guess, so contact wayne to help improve this table</p>    

    <form method='post' action='/mmr/submit'>
         <input placeholder="Enter Summoner's Name" name="summonerName" value=""/>
         <button type='submit'>Submit</button>
    </form>

    <br><br>
    <table>
      <tr>
        <th>Rank</th>
        <th>MMR</th>
      </tr>
      ${mmrRows}
    </table>


  `);
})

app.post('/mmr/submit', function (req, res) {
  return res.redirect(`/mmr/${req.body.summonerName}`); 
})


app.get('/mmr/:name', function (req, res) {

  if (req.params.name) {
    request(`https://na.op.gg/summoners/na/${req.params.name}`, function (error, response, body) {

      let opggdata = body;
      var encryptedID = opggdata.match(/"summoner_id":"(.*?)","acct_id/);

      if (!encryptedID) {
        return res.send('user does not exist');
      }

      encryptedID = encryptedID[1];

      request.post(`https://na.op.gg/api/summoners/na/${encryptedID}/renewal`, function (error, response, body) {


        const intervalID = setInterval( checkRenewal, 500);

        function checkRenewal(){

          request(`https://na.op.gg/api/summoners/na/${encryptedID}/renewal-status`, function (error, response, body) {
              body = JSON.parse(body);

              if (body && ((body.message == 'Already renewed.') || (body.message == 'Failed to renew.'))) {

                clearInterval(intervalID);
                console.log('clearInterval');

                request(`https://na.op.gg/api/games/na/summoners/${encryptedID}?hl=en_US&game_type=NORMAL`, function (error, response, body) {

                  let jsonData = JSON.parse(body);
                  jsonData.data = jsonData.data.filter(match => match.average_tier_info);

                  if (jsonData.data.length == 0) {
                    return res.send('no matches for this user')
                  }
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

                    <h1>Simple MMR Checker</h1>

                    <p>This tool checks user's MMR in normals. Currently only works for NA. <br> 
                    To get the most accurate mmr, <b>play 20 games solo in normals</b>. Queueing with other players will cause inaccurate result.<br>
                    The tool uses below table to convert rank to mmr. This is mostly a guess, so contact wayne to help improve this table</p>      

                    <div><b>Name: </b> ${req.params.name}</div>
                    <div><b>Recent Matches Avg MMR: </b> ${recentMatchesAvgMMR}</div>
                    <div><b>Number of Matches Analyzed: </b> ${jsonData.data.length}</div>
                    <div><b>Recent Matches Tiers: </b> ${recentMatchesTiers}</div>
                    <br><br>
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



              }

          })
        }



      });


    });
  } else {
    res.send('name missing');
  }




})

app.listen(port, () => console.log(`App listening on port ${port}!`));
