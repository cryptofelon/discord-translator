import { Client, Intents, Message } from "discord.js";
import { TranslationServiceClient } from "@google-cloud/translate";
import { decode } from "he";

require("dotenv").config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const dcToken = process.env.BOT_TOKEN;

const translationClient = new TranslationServiceClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

// s

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;


const TEXPlanningBrazilChannels = [
  // 
  "1184967865762332692", // general
  "1184967817146155049",  // requests
  "1184967796313030667" // delivery

]


const isBrazilChannel = (channelId: string) => {
  return TEXPlanningBrazilChannels.includes(channelId);
}


const SOURCE_LANG_EN = "en";
const TARGET_LANG_FR = "pt";
const LOCATION = "global";

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});


client.on("messageCreate", async (msg: Message) => {
  if (isBrazilChannel(msg.channelId) && !msg.author.bot) {
    try {
      console.log("Content to translate:", msg.content);
      const detectionRequest = {
        parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${LOCATION}`,

        content: msg.content,
      };

      const [detectionResponse] = await translationClient.detectLanguage(
        detectionRequest
      );

      console.log("Det res", detectionResponse);
      const sourceLangObj = detectionResponse?.languages;
      if (sourceLangObj) {
        const sourceLang = sourceLangObj[0].languageCode;
        const targetLang =
          sourceLang === SOURCE_LANG_EN ? TARGET_LANG_FR : SOURCE_LANG_EN;

        console.log("targetLang", targetLang);

        const translationRequest = {
          parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${LOCATION}`,
          contents: [msg.content],
          sourceLanguageCode: sourceLang,
          targetLanguageCode: targetLang,
        };

        const [translationResponse] = await translationClient.translateText(
          translationRequest
        );

        console.log("Res", translationResponse);

        const translatedTextObj = translationResponse?.translations;

        if (translatedTextObj) {
          const translatedText = translatedTextObj[0].translatedText;

          console.log("translatedText", translatedText);

          if (translatedText) {
            const decodedText = decode(translatedText); // Decode the HTML-encoded text

            msg.channel.send(`(${sourceLang} -> ${targetLang}) ${decodedText}`);
          }
        }
      }
    } catch (error) {
      console.error("Error translating message:", error);
    }
  }
});

client.login(dcToken);
