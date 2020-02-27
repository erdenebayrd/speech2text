const recorder = require("node-record-lpcm16");

async function translateTextToJapanese(text) {
  const projectId = "videoapiservice-265212";
  const location = "global";

  // Imports the Google Cloud Translation library
  const { TranslationServiceClient } = require("@google-cloud/translate");

  // Instantiates a client
  const translationClient = new TranslationServiceClient();
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: "text/plain", // mime types: text/plain, text/html
    sourceLanguageCode: "en",
    targetLanguageCode: "ja"
  };

  try {
    // Run request
    const [response] = await translationClient.translateText(request);
    let results = [];
    for (const translation of response.translations) {
      results.push(translation.translatedText);
    }
    return results;
  } catch (error) {
    console.error(error.details);
  }
}
// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");

// Creates a client
const client = new speech.SpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "en-US";

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode
  },
  interimResults: true // If you want interim results, set this to true
};

// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request)
  .on("error", console.error)
  .on("data", async data => {
    if (data.results[0] && data.results[0].alternatives[0]) {
      const englishText = data.results[0].alternatives[0].transcript;
      const japaneseText = await translateTextToJapanese(englishText);
      console.log(englishText + "\n" + japaneseText + "\n");
    } else {
      console.log(`\n\nReached transcription time limit, press Ctrl+C\n`);
    }
  });

// Start recording and send the microphone input to the Speech API.
// Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
recorder
  .record({
    sampleRateHertz: sampleRateHertz,
    threshold: 0,
    // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
    verbose: false,
    recordProgram: "rec", // Try also "arecord" or "sox"
    silence: "10.0"
  })
  .stream()
  .on("error", console.error)
  .pipe(recognizeStream);

console.log("Listening, press Ctrl+C to stop.");
