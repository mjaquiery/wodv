exports.handler = main;
require('dotenv').config();
const {
    GOOGLE_SPREADSHEET_ID_FROM_URL,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY
} = process.env;

/* API use script adapted from https://www.swyx.io/netlify-google-sheets/ */
const { GoogleSpreadsheet } = require('google-spreadsheet');

/**
 * Process requests from a client
 * @param event {object} request details
 * @param context {object} environment details
 * @param callback {function(error: string|null, response: HTTPResponse) => void} function to send the response to the client
 */
async function main(event, context, callback) {
    try {
        console.log(`Fetching Google Sheets content`)

        const doc = new GoogleSpreadsheet(GOOGLE_SPREADSHEET_ID_FROM_URL);
        // https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        await doc.useServiceAccountAuth({
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        });

        await doc.loadInfo(); // loads document properties and worksheets. required.

        const sheets = [
            doc.sheetsByIndex[0],
            doc.sheetsByIndex[1],
            doc.sheetsByIndex[2]
        ];
        console.log({sheets})
        const rows = await Promise.allSettled(sheets.map(s => s.getRows()));
        //console.log(rows[1].value)

        switch(event.headers.task) {
            case "addPlayer":
                await addPlayer(event, rows);
                callback(null, {statusCode: 200, body: JSON.stringify({
                        success: true
                    })});
                break;
            default:
                callback(null, {
                    statusCode: 200,
                    body: JSON.stringify(
                        rows.map(r => r.value.map(x => serializeRow(x)))
                    )
                });
        }
    } catch(e) {
        console.error(e);
        callback(e);
    }
}

/*
 * utils
 */
function serializeRow(row) {
    let temp = {};
    try {
        row._sheet.headerValues.map((header) => {
            temp[header] = row[header];
        });
    } catch(e) {
        console.log({error: e, row});
    }
    return temp;
}

async function addPlayer(event, rows) {
    const players = rows[0].value;
    const sessions = rows[1].value;
    const body = JSON.parse(event.body);
    const player = body.playerName;
    const session = body.sessionId;
    const playerRow = players.filter(p => p.Player === player);
    if(!playerRow.length)
        throw new Error(`Could not find player with name "${player}"`);
    const targetSession = sessions.filter(s => s.id === session);
    if(!targetSession.length)
        throw new Error(`Could not find session with id "${session}"`);

    const sessionMax = parseInt(targetSession[0]['Max players']);
    const sessionPlayers = players.filter(p => p.Session === session).length;
    if(sessionPlayers >= sessionMax)
        throw new Error(`Session already has ${sessionPlayers}/${sessionMax} players`);

    playerRow[0].Session = session;
    console.log(playerRow[0])
    await playerRow[0].save();
}