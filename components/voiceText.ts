// Voice Assistant ki screen ke shabd, teen bhashaon mein
export type UiLang = "hi" | "hinglish" | "en";

export const LANG_OPTIONS: { id: UiLang; label: string; rec: string; voice: string }[] = [
  { id: "hi", label: "हिंदी", rec: "hi-IN", voice: "hi-IN" },
  { id: "hinglish", label: "Hinglish", rec: "hi-IN", voice: "hi-IN" },
  { id: "en", label: "English", rec: "en-IN", voice: "en-IN" },
];

type Ui = {
  launch: string; launchSub: string; title: string; voice: string; close: string;
  micOn: string; micOff: string; starting: string; listening: string; thinking: string;
  speaking: string; error: string; waiting: string; tapToSpeak: string; typeBelow: string;
  youSaid: string; retry: string; yes: string; no: string; noChange: string;
  repeat: string; stop: string; whatAiDid: string; placeholder: string; send: string;
  example: string; exampleText: string; footer: string; activity: string; okay: string;
  language: string; startSpeaking: string; stopListening: string; openLabel: string;
  micErrors: Record<string, string>;
};

const HINGLISH: Ui = {
  launch: "Bolkar batao", launchSub: "Hindi, Hinglish ya English", title: "KaamKhoj Voice Assistant",
  voice: "Awaaz", close: "Band karo", micOn: "Mic ON · rokne ke liye tap", micOff: "Mic OFF",
  starting: "Mic chalu ho raha hai...", listening: "Boliye, main sun raha hoon...", thinking: "Samajh raha hoon...",
  speaking: "Jawab suno...", error: "Dikkat aayi", waiting: "Aapki haan ka intezaar",
  tapToSpeak: "Bolne ke liye mic tap karein", typeBelow: "Neeche likhkar bhejiye", youSaid: "Aapne kaha",
  retry: "↻ Dobara koshish", yes: "Haan, karo", no: "Nahi", noChange: "Theek hai, kuch nahi badla.",
  repeat: "↻ Dobara suno", stop: "■ Bolna roko", whatAiDid: "AI ne kya kiya", placeholder: "Ya yahan likhiye...",
  send: "Bhejo", example: "Jaise:", exampleText: "Painter chahiye kal 2 ghante ke liye",
  footer: "AI sirf form bharta hai aur page kholta hai. Post, chunna, cancel aap khud karte ho",
  activity: "AI activity", okay: "Theek hai", language: "Bhasha", startSpeaking: "Bolna shuru karo",
  stopListening: "Sunna band karo", openLabel: "Voice assistant kholo",
  micErrors: {
    "not-allowed": "Mic ki ijaazat nahi mili. Address bar mein 🔒 dabakar Microphone 'Allow' kariye, ya neeche likh dijiye.",
    "service-not-allowed": "Is browser mein voice band hai. Chrome try kariye, ya neeche likh dijiye.",
    "no-speech": "Kuch sunai nahi diya. Mic paas rakhkar, tap karte hi boliye.",
    "audio-capture": "Mic nahi mila. Windows ki Sound settings mein sahi mic chuniye.",
    network: "Voice ke liye internet chahiye. Neeche likh bhi sakte hain.",
    timeout: "Bahut der tak kuch sunai nahi diya. Dobara tap karke boliye.",
    unsupported: "Is browser mein voice nahi chalta (Chrome ya Edge try kariye). Neeche likh dijiye.",
    start: "Mic shuru nahi hua. Dobara tap kariye.",
    other: "Voice mein dikkat aayi. Dobara tap kariye, ya neeche likh dijiye.",
    net: "Internet check kariye",
  },
};

const HINDI: Ui = {
  launch: "बोलकर बताओ", launchSub: "हिंदी, Hinglish या English", title: "काम खोज वॉइस असिस्टेंट",
  voice: "आवाज़", close: "बंद करो", micOn: "माइक चालू · रोकने के लिए दबाएँ", micOff: "माइक बंद",
  starting: "माइक चालू हो रहा है...", listening: "बोलिए, मैं सुन रहा हूँ...", thinking: "समझ रहा हूँ...",
  speaking: "जवाब सुनिए...", error: "दिक़्क़त आई", waiting: "आपकी हाँ का इंतज़ार",
  tapToSpeak: "बोलने के लिए माइक दबाएँ", typeBelow: "नीचे लिखकर भेजिए", youSaid: "आपने कहा",
  retry: "↻ दोबारा कोशिश", yes: "हाँ, करो", no: "नहीं", noChange: "ठीक है, कुछ नहीं बदला।",
  repeat: "↻ दोबारा सुनो", stop: "■ बोलना रोको", whatAiDid: "AI ने क्या किया", placeholder: "या यहाँ लिखिए...",
  send: "भेजो", example: "जैसे:", exampleText: "कल 2 घंटे के लिए पेंटर चाहिए",
  footer: "AI सिर्फ़ फ़ॉर्म भरता है और पेज खोलता है। पोस्ट, चुनना, कैंसल आप ख़ुद करते हैं",
  activity: "AI गतिविधि", okay: "ठीक है", language: "भाषा", startSpeaking: "बोलना शुरू करो",
  stopListening: "सुनना बंद करो", openLabel: "वॉइस असिस्टेंट खोलो",
  micErrors: {
    "not-allowed": "माइक की इजाज़त नहीं मिली। ऊपर 🔒 दबाकर Microphone 'Allow' कीजिए, या नीचे लिखिए।",
    "service-not-allowed": "इस ब्राउज़र में आवाज़ बंद है। Chrome आज़माइए, या नीचे लिखिए।",
    "no-speech": "कुछ सुनाई नहीं दिया। माइक पास रखकर, दबाते ही बोलिए।",
    "audio-capture": "माइक नहीं मिला। Windows की Sound settings में सही माइक चुनिए।",
    network: "आवाज़ के लिए इंटरनेट चाहिए। नीचे लिख भी सकते हैं।",
    timeout: "बहुत देर तक कुछ सुनाई नहीं दिया। दोबारा दबाकर बोलिए।",
    unsupported: "इस ब्राउज़र में आवाज़ नहीं चलती (Chrome या Edge आज़माइए)। नीचे लिखिए।",
    start: "माइक शुरू नहीं हुआ। दोबारा दबाइए।",
    other: "आवाज़ में दिक़्क़त आई। दोबारा दबाइए, या नीचे लिखिए।",
    net: "इंटरनेट जाँचिए",
  },
};

const ENGLISH: Ui = {
  launch: "Speak to KaamKhoj", launchSub: "Hindi, Hinglish or English", title: "KaamKhoj Voice Assistant",
  voice: "Voice", close: "Close", micOn: "Mic ON · tap to stop", micOff: "Mic OFF",
  starting: "Starting the mic...", listening: "Go ahead, I'm listening...", thinking: "Understanding...",
  speaking: "Listen to the reply...", error: "Something went wrong", waiting: "Waiting for your yes",
  tapToSpeak: "Tap the mic to speak", typeBelow: "Type below and send", youSaid: "You said",
  retry: "↻ Try again", yes: "Yes, do it", no: "No", noChange: "Okay, nothing was changed.",
  repeat: "↻ Hear again", stop: "■ Stop speaking", whatAiDid: "What the AI did", placeholder: "Or type here...",
  send: "Send", example: "Example:", exampleText: "I need a painter tomorrow for 2 hours",
  footer: "The AI only fills forms and opens pages. You post, choose and cancel yourself",
  activity: "AI activity", okay: "OK", language: "Language", startSpeaking: "Start speaking",
  stopListening: "Stop listening", openLabel: "Open voice assistant",
  micErrors: {
    "not-allowed": "Microphone permission was denied. Click 🔒 in the address bar and allow the microphone, or type below.",
    "service-not-allowed": "Voice is disabled in this browser. Try Chrome, or type below.",
    "no-speech": "I didn't hear anything. Keep the mic close and speak right after tapping.",
    "audio-capture": "No microphone found. Choose the right mic in Windows Sound settings.",
    network: "Voice needs internet. You can also type below.",
    timeout: "I didn't hear anything for a while. Tap and speak again.",
    unsupported: "Voice doesn't work in this browser (try Chrome or Edge). Type below.",
    start: "The mic didn't start. Tap again.",
    other: "Voice had a problem. Tap again, or type below.",
    net: "Check your internet",
  },
};

export const UI: Record<UiLang, Ui> = { hi: HINDI, hinglish: HINGLISH, en: ENGLISH };
