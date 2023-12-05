const fs = require("fs");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const Facebook = require("facebook-js-sdk");
const { match } = require("assert");
const FB = new Facebook({
    appId: process.env.FB_APP_ID,
    graphVersion: process.env.GRAHP_VER,
});

const PIXEL_PATH = "./src/pixels/pixels.json";
const AC_PATH = "./src/pixels/access_token.json";

let currentBot = null;
let currentAC = "";

let pixels = {};
let ACInfos = {};

fs.readFile(PIXEL_PATH, "utf8", (err, data) => {
    if (err) {
        return;
    }

    pixels = JSON.parse(data);
    currentBot = Object.keys(pixels)[0];
});

fs.readFile(AC_PATH, "utf8", (err, data) => {
    if (err) {
        return;
    }

    ACInfos = JSON.parse(data);
    currentAC = JSON.parse(data)?.token;
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const commands = [
        "/list",
        "/check",
        "/help",
        "/add (Tên pixel) (ID BM) (ID Pixel)",
        "/change (Tên pixel cần đổi)",
        "/del (Tên pixel)",
        "/token (Token)",
        "/share (ID QC)",
    ];

    bot.sendMessage(chatId, `Danh sách lệnh:\n${commands.join("\n")}`);
});

bot.onText(/\/list/, (msg) => {
    const chatId = msg.chat.id;
    const pixelList = Object.keys(pixels);

    bot.sendMessage(
        chatId,
        `Có ${pixelList.length} con:\n${pixelList.join("\n")}`
    );
});

bot.onText(/\/check/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `Pixel đang dùng: ${currentBot}`);
    bot.sendMessage(chatId, `Token đang dùng: ${currentAC}`);
});

bot.onText(/\/change (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    const values = resp.split(" ");

    if (!values[0]) {
        bot.sendMessage(chatId, "Nhập tên pixel vào thằng lz");
        return;
    }

    if (!pixels[values[0]]) {
        bot.sendMessage(chatId, "Có đéo con pixel này đâu?");
        return;
    }

    currentBot = values[0];
    bot.sendMessage(chatId, "Thay pixel xong rồi đấy");
});

bot.onText(/\/add (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    const values = resp.split(" ");

    if (!values[0] || !values[1] || !values[2]) {
        bot.sendMessage(msg.chat.id, `Nhập đầy đủ tên, bm, và id của pixel đê`);
        return;
    }

    const newBot = {
        [values[0]]: {
            bm: values[1],
            id: values[2],
        },
    };

    const content = JSON.stringify({ ...pixels, ...newBot });

    fs.writeFile(PIXEL_PATH, content, (err) => {
        if (err) {
            bot.sendMessage(chatId, "Thêm pixel tạch");
            return;
        }

        bot.sendMessage(chatId, `Thêm pixel '${values[0]}' oke rồi nhó`);
    });
});

bot.onText(/\/del (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1] ?? "";
    const values = resp.split(" ");

    if (!pixels[values[0]]) {
        bot.sendMessage(chatId, "Không có con này, ngáo à");
        return;
    }

    delete pixels[values[0]];

    fs.writeFile(PIXEL_PATH, JSON.stringify(pixels), (err) => {
        if (err) {
            bot.sendMessage(chatId, "Xoá lỗi rồi mày ơi");
            return;
        }

        bot.sendMessage(chatId, `Xoá Pixel ${values[0]} oke rồi đấy`);
    });
});

bot.onText(/\/share (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    let input = match["input"].toString();
    input = input.replace(/\n/g, " ");
    input = input.replace(/\/share /g, "");

    const values = [...input.split(" ")];

    const promises = [];

    values.map((value) => {
        promises.push(
            FB.post(`/${pixels[currentBot].id}/shared_accounts`, {
                account_id: value,
                access_token: currentAC,
                business: pixels[currentBot].bm,
            })
                .then((res) => {
                    bot.sendMessage(
                        chatId,
                        `Share oke cho id '${value}' rồi đấy`
                    );
                })
                .catch((err) => {
                    bot.sendMessage(chatId, `Share xịt cho id '${value}' nha`);
                })
        );
    });

    Promise.all(promises);
});

bot.onText(/\/token (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    FB.setAccessToken(resp);
    FB.get("/me?fields=id,name")
        .then((res) => {
            bot.sendMessage(chatId, "Set token thành công");

            ACInfos.token = resp;
            ACInfos.info = res.data;

            fs.writeFile(AC_PATH, JSON.stringify(ACInfos), (err) => {
                if (err) {
                    console.log("loi me roi");
                }
            });
        })
        .catch((err) => {
            bot.sendMessage(chatId, "Đéo được");
        });
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.toString();

    const textSplit = text.split(" ");

    switch (textSplit[0].toLowerCase()) {
        case "hello":
            bot.sendMessage(chatId, "Loo con cac");
            break;
        case "dm":
        case "dcm":
        case "dcmm":
        case "dit":
            bot.sendMessage(chatId, "Chui con cac");
            break;
        case "tuan":
            bot.sendMessage(chatId, "Đẹp trai");
            break;
        case "ngủ":
            bot.sendMessage(chatId, "Đại ka ngủ ngon");
            break;
        default:
            break;
    }
});
