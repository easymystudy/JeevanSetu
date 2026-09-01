
const patients = [
  {id:"JS-00124", name:"Ravi Kumar", age:45, gender:"Male", visit:"12 May 2026", condition:"Hypertension", status:"stable", blood:"B+", initials:"RK", allergies:"None", meds:"Amlodipine 5mg", history:[
    ["12 May 2026","BP high","Prescribed Amlodipine 5mg","Dr. Anil Verma"],
    ["10 Apr 2026","Routine checkup","Vitals reviewed; stable","Dr. Anil Verma"],
    ["05 Mar 2026","Fever / cold","Prescribed Paracetamol","Dr. Anil Verma"]
  ]},
  {id:"JS-00131", name:"Sneha Sharma", age:32, gender:"Female", visit:"10 May 2026", condition:"Diabetes — controlled", status:"stable", blood:"O+", initials:"SS", allergies:"Penicillin", meds:"Metformin 500mg", history:[
    ["10 May 2026","Diabetes review","HbA1c reviewed; controlled","Dr. Anil Verma"],
    ["12 Mar 2026","Routine checkup","Medication continued","Dr. Anil Verma"]
  ]},
  {id:"JS-00142", name:"Amit Singh", age:50, gender:"Male", visit:"09 May 2026", condition:"High BP", status:"attention", blood:"A+", initials:"AS", allergies:"None", meds:"Losartan 50mg", history:[
    ["09 May 2026","Elevated BP","Follow-up advised in 7 days","Dr. Anil Verma"],
    ["11 Apr 2026","Routine checkup","BP monitoring advised","Dr. Anil Verma"]
  ]},
  {id:"JS-00157", name:"Pooja Verma", age:28, gender:"Female", visit:"08 May 2026", condition:"Healthy", status:"stable", blood:"AB+", initials:"PV", allergies:"None", meds:"None", history:[
    ["08 May 2026","Annual checkup","No concerns found","Dr. Anil Verma"]
  ]},
  {id:"JS-00168", name:"Mohit Joshi", age:60, gender:"Male", visit:"07 May 2026", condition:"Diabetes", status:"attention", blood:"B-", initials:"MJ", allergies:"None", meds:"Metformin 500mg", history:[
    ["07 May 2026","Blood sugar high","Diet + medication review","Dr. Anil Verma"],
    ["04 Apr 2026","Diabetes follow-up","Medication adjusted","Dr. Anil Verma"]
  ]},
  {id:"JS-00176", name:"Neha Gupta", age:39, gender:"Female", visit:"06 May 2026", condition:"Thyroid", status:"stable", blood:"A+", initials:"NG", allergies:"None", meds:"Levothyroxine", history:[
    ["06 May 2026","Thyroid review","TSH within target","Dr. Anil Verma"]
  ]}
];

let currentRole = "doctor";
let selectedPatient = patients[0];
let questionIndex = 0;
let consultationAnswers = [];
let jarvisLanguage = "en";
let authMethod = "aadhaar";
let navigationStack = [];
let suppressNavigation = false;
let inputMode = "text";
let recognition = null;
let authVerified = false;
let verifiedCredential = "";
let activeQuestions = [];
let currentConcern = "";

const LANGUAGES = {
  en:{name:"English", speech:"en-IN"}, hi:{name:"हिन्दी", speech:"hi-IN"}, bn:{name:"বাংলা", speech:"bn-IN"},
  te:{name:"తెలుగు", speech:"te-IN"}, mr:{name:"मराठी", speech:"mr-IN"}, ta:{name:"தமிழ்", speech:"ta-IN"},
  gu:{name:"ગુજરાતી", speech:"gu-IN"}, kn:{name:"ಕನ್ನಡ", speech:"kn-IN"}, ml:{name:"മലയാളം", speech:"ml-IN"}, pa:{name:"ਪੰਜਾਬੀ", speech:"pa-IN"}
};

const T = {
  en:{question:"Question",of:"of",back:"Back",next:"Next",review:"Review & save",selectAll:"Select all that apply.",required:"Please answer this question before continuing.",
    voiceReady:"Voice mode ready",listening:"Listening… speak now",speaking:"JARVIS is speaking…",noVoice:"Voice recognition is not supported in this browser. You can continue with text.",
    listen:"Tap microphone to answer",stop:"Stop listening",speakAgain:"Speak question again",useText:"Use text instead",save:"Save consultation",saved:"Consultation saved.",
    optional:"Optional medical document",optionalHelp:"Attach a report, prescription or scan, or skip this step.",choose:"Choose files",skip:"Skip — documents are optional",
    smart:"JARVIS has added a few questions based on your current issue.",urgent:"If you have severe breathing difficulty, severe chest pain, fainting, blue lips, heavy bleeding, or feel seriously unwell, seek urgent medical care rather than relying on this questionnaire."},
  hi:{question:"प्रश्न",of:"में से",back:"पीछे",next:"आगे",review:"जाँचकर सेव करें",selectAll:"लागू होने वाले सभी विकल्प चुनें।",required:"आगे बढ़ने से पहले इस प्रश्न का उत्तर दें।",voiceReady:"वॉइस मोड तैयार है",listening:"सुन रहा हूँ… अभी बोलें",speaking:"JARVIS बोल रहा है…",noVoice:"इस ब्राउज़र में वॉइस पहचान उपलब्ध नहीं है। आप टेक्स्ट से जारी रख सकते हैं।",listen:"उत्तर देने के लिए माइक्रोफोन दबाएँ",stop:"सुनना बंद करें",speakAgain:"प्रश्न फिर सुनें",useText:"टेक्स्ट का उपयोग करें",save:"परामर्श सेव करें",saved:"परामर्श सेव हो गया।",optional:"वैकल्पिक मेडिकल दस्तावेज़",optionalHelp:"रिपोर्ट, प्रिस्क्रिप्शन या स्कैन जोड़ें, या इसे छोड़ दें।",choose:"फाइल चुनें",skip:"छोड़ें — दस्तावेज़ वैकल्पिक हैं",smart:"आपकी वर्तमान समस्या के आधार पर JARVIS ने कुछ अतिरिक्त प्रश्न जोड़े हैं।",urgent:"अगर सांस लेने में बहुत परेशानी, तेज सीने का दर्द, बेहोशी, होंठ नीले पड़ना, बहुत ज्यादा रक्तस्राव या बहुत गंभीर तबीयत हो, तो प्रश्नावली पर निर्भर न रहें और तुरंत चिकित्सा सहायता लें।"},
  bn:{name:"বাংলা",question:"প্রশ্ন",of:"এর মধ্যে",back:"পিছনে",next:"পরেরটি",review:"পর্যালোচনা ও সংরক্ষণ",selectAll:"যেগুলো প্রযোজ্য সব নির্বাচন করুন।",required:"এগিয়ে যাওয়ার আগে উত্তর দিন।",voiceReady:"ভয়েস মোড প্রস্তুত",listening:"শুনছি… এখন বলুন",speaking:"JARVIS কথা বলছে…",noVoice:"এই ব্রাউজারে ভয়েস সনাক্তকরণ নেই। টেক্সট ব্যবহার করুন।",listen:"উত্তর দিতে মাইক্রোফোন চাপুন",stop:"শোনা বন্ধ করুন",speakAgain:"প্রশ্ন আবার শুনুন",useText:"টেক্সট ব্যবহার করুন",save:"পরামর্শ সংরক্ষণ করুন",saved:"পরামর্শ সংরক্ষিত হয়েছে।",optional:"ঐচ্ছিক মেডিকেল নথি",optionalHelp:"রিপোর্ট, প্রেসক্রিপশন বা স্ক্যান যোগ করুন, অথবা এড়িয়ে যান।",choose:"ফাইল বাছুন",skip:"এড়িয়ে যান — নথি ঐচ্ছিক",smart:"আপনার বর্তমান সমস্যার ভিত্তিতে JARVIS কিছু অতিরিক্ত প্রশ্ন যোগ করেছে।",urgent:"তীব্র শ্বাসকষ্ট, তীব্র বুকব্যথা, অজ্ঞান হওয়া বা গুরুতর অসুস্থতা হলে দ্রুত চিকিৎসা নিন।"},
  te:{question:"ప్రశ్న",of:"లో",back:"వెనుక",next:"తర్వాత",review:"సమీక్షించి సేవ్ చేయండి",selectAll:"వర్తించే అన్ని ఎంపికలను ఎంచుకోండి.",required:"కొనసాగించే ముందు సమాధానం ఇవ్వండి.",voiceReady:"వాయిస్ మోడ్ సిద్ధంగా ఉంది",listening:"వింటున్నాను… ఇప్పుడు మాట్లాడండి",speaking:"JARVIS మాట్లాడుతోంది…",noVoice:"ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు లేదు. టెక్స్ట్ ఉపయోగించండి.",listen:"సమాధానం కోసం మైక్రోఫోన్ నొక్కండి",stop:"వినడం ఆపు",speakAgain:"ప్రశ్న మళ్లీ వినండి",useText:"టెక్స్ట్ ఉపయోగించండి",save:"సేవ్ చేయండి",saved:"పరామర్శ సేవ్ చేయబడింది.",optional:"ఐచ్ఛిక వైద్య పత్రం",optionalHelp:"రిపోర్ట్, ప్రిస్క్రిప్షన్ లేదా స్కాన్ జోడించండి లేదా దాటవేయండి.",choose:"ఫైళ్లు ఎంచుకోండి",skip:"దాటవేయండి — పత్రాలు ఐచ్ఛికం",smart:"మీ ప్రస్తుత సమస్య ఆధారంగా JARVIS కొన్ని అదనపు ప్రశ్నలు జోడించింది.",urgent:"తీవ్రమైన శ్వాస ఇబ్బంది లేదా ఛాతి నొప్పి ఉంటే వెంటనే వైద్య సహాయం పొందండి."},
  mr:{question:"प्रश्न",of:"पैकी",back:"मागे",next:"पुढे",review:"तपासून सेव्ह करा",selectAll:"लागू असलेले सर्व पर्याय निवडा.",required:"पुढे जाण्यापूर्वी उत्तर द्या.",voiceReady:"व्हॉइस मोड तयार आहे",listening:"ऐकत आहे… आता बोला",speaking:"JARVIS बोलत आहे…",noVoice:"या ब्राउझरमध्ये व्हॉइस ओळख उपलब्ध नाही. टेक्स्ट वापरा.",listen:"उत्तर देण्यासाठी मायक्रोफोन दाबा",stop:"ऐकणे थांबवा",speakAgain:"प्रश्न पुन्हा ऐका",useText:"टेक्स्ट वापरा",save:"सेव्ह करा",saved:"सल्ला सेव्ह झाला.",optional:"ऐच्छिक वैद्यकीय दस्तऐवज",optionalHelp:"रिपोर्ट, प्रिस्क्रिप्शन किंवा स्कॅन जोडा किंवा वगळा.",choose:"फाइल निवडा",skip:"वगळा — दस्तऐवज ऐच्छिक आहेत",smart:"तुमच्या सध्याच्या समस्येनुसार JARVIS ने काही अतिरिक्त प्रश्न जोडले आहेत.",urgent:"तीव्र श्वास घेण्यास त्रास किंवा छातीत तीव्र दुखत असल्यास त्वरित वैद्यकीय मदत घ्या."},
  ta:{question:"கேள்வி",of:"இல்",back:"பின்",next:"அடுத்து",review:"மதிப்பாய்வு செய்து சேமிக்கவும்",selectAll:"பொருந்தும் அனைத்தையும் தேர்ந்தெடுக்கவும்.",required:"தொடர்வதற்கு முன் பதிலளிக்கவும்.",voiceReady:"குரல் முறை தயார்",listening:"கேட்கிறேன்… இப்போது பேசுங்கள்",speaking:"JARVIS பேசுகிறது…",noVoice:"இந்த உலாவியில் குரல் அறிதல் இல்லை. உரையைப் பயன்படுத்தவும்.",listen:"பதிலளிக்க மைக்ரோஃபோனை அழுத்தவும்",stop:"கேட்பதை நிறுத்து",speakAgain:"கேள்வியை மீண்டும் கேள்",useText:"உரையைப் பயன்படுத்து",save:"சேமிக்கவும்",saved:"ஆலோசனை சேமிக்கப்பட்டது.",optional:"விருப்ப மருத்துவ ஆவணம்",optionalHelp:"அறிக்கை, மருந்துச் சீட்டு அல்லது ஸ்கேன் சேர்க்கலாம் அல்லது தவிர்க்கலாம்.",choose:"கோப்புகளைத் தேர்ந்தெடு",skip:"தவிர்க்கவும் — ஆவணங்கள் விருப்பம்",smart:"உங்கள் தற்போதைய பிரச்சினையைப் பொறுத்து JARVIS கூடுதல் கேள்விகளைச் சேர்த்துள்ளது.",urgent:"கடுமையான மூச்சுத்திணறல் அல்லது மார்பு வலி இருந்தால் உடனடி மருத்துவ உதவி பெறுங்கள்."},
  gu:{question:"પ્રશ્ન",of:"માંથી",back:"પાછળ",next:"આગળ",review:"ચકાસો અને સેવ કરો",selectAll:"લાગુ પડતા બધા વિકલ્પો પસંદ કરો.",required:"આગળ વધતા પહેલાં જવાબ આપો.",voiceReady:"વૉઇસ મોડ તૈયાર છે",listening:"સાંભળી રહ્યો છું… હવે બોલો",speaking:"JARVIS બોલી રહ્યું છે…",noVoice:"આ બ્રાઉઝરમાં વૉઇસ ઓળખ ઉપલબ્ધ નથી. ટેક્સ્ટનો ઉપયોગ કરો.",listen:"જવાબ આપવા માઇક્રોફોન દબાવો",stop:"સાંભળવાનું બંધ કરો",speakAgain:"પ્રશ્ન ફરી સાંભળો",useText:"ટેક્સ્ટનો ઉપયોગ કરો",save:"સેવ કરો",saved:"પરામર્શ સેવ થયો.",optional:"વૈકલ્પિક તબીબી દસ્તાવેજ",optionalHelp:"રિપોર્ટ, પ્રિસ્ક્રિપ્શન અથવા સ્કેન ઉમેરો અથવા છોડો.",choose:"ફાઇલો પસંદ કરો",skip:"છોડો — દસ્તાવેજો વૈકલ્પિક છે",smart:"તમારી હાલની સમસ્યા આધારે JARVIS એ થોડા વધારાના પ્રશ્નો ઉમેર્યા છે.",urgent:"ગંભીર શ્વાસની તકલીફ અથવા છાતીમાં ભારે દુખાવો હોય તો તરત તબીબી મદદ લો."},
  kn:{question:"ಪ್ರಶ್ನೆ",of:"ರಲ್ಲಿ",back:"ಹಿಂದೆ",next:"ಮುಂದೆ",review:"ಪರಿಶೀಲಿಸಿ ಉಳಿಸಿ",selectAll:"ಅನ್ವಯಿಸುವ ಎಲ್ಲ ಆಯ್ಕೆಗಳನ್ನು ಆರಿಸಿ.",required:"ಮುಂದುವರಿಯುವ ಮೊದಲು ಉತ್ತರಿಸಿ.",voiceReady:"ವಾಯ್ಸ್ ಮೋಡ್ ಸಿದ್ಧವಾಗಿದೆ",listening:"ಕೇಳುತ್ತಿದ್ದೇನೆ… ಈಗ ಮಾತನಾಡಿ",speaking:"JARVIS ಮಾತನಾಡುತ್ತಿದೆ…",noVoice:"ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಇಲ್ಲ. ಪಠ್ಯ ಬಳಸಿ.",listen:"ಉತ್ತರಿಸಲು ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ",stop:"ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ",speakAgain:"ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಕೇಳಿ",useText:"ಪಠ್ಯ ಬಳಸಿ",save:"ಉಳಿಸಿ",saved:"ಸಮಾಲೋಚನೆ ಉಳಿಸಲಾಗಿದೆ.",optional:"ಐಚ್ಛಿಕ ವೈದ್ಯಕೀಯ ದಾಖಲೆ",optionalHelp:"ವರದಿ, ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಸೇರಿಸಿ ಅಥವಾ ಬಿಟ್ಟುಬಿಡಿ.",choose:"ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ",skip:"ಬಿಟ್ಟುಬಿಡಿ — ದಾಖಲೆ ಐಚ್ಛಿಕ",smart:"ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸಮಸ್ಯೆಯ ಆಧಾರದ ಮೇಲೆ JARVIS ಕೆಲವು ಹೆಚ್ಚುವರಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಸೇರಿಸಿದೆ.",urgent:"ತೀವ್ರ ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ಎದೆ ನೋವು ಇದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ."},
  ml:{question:"ചോദ്യം",of:"ൽ",back:"പിന്നോട്ട്",next:"അടുത്തത്",review:"പരിശോധിച്ച് സേവ് ചെയ്യുക",selectAll:"ബാധകമായ എല്ലാം തിരഞ്ഞെടുക്കുക.",required:"തുടരുന്നതിന് മുമ്പ് ഉത്തരം നൽകുക.",voiceReady:"വോയ്സ് മോഡ് തയ്യാറാണ്",listening:"കേൾക്കുന്നു… ഇപ്പോൾ സംസാരിക്കുക",speaking:"JARVIS സംസാരിക്കുന്നു…",noVoice:"ഈ ബ്രൗസറിൽ വോയ്സ് തിരിച്ചറിയൽ ലഭ്യമല്ല. ടെക്സ്റ്റ് ഉപയോഗിക്കുക.",listen:"ഉത്തരം നൽകാൻ മൈക്രോഫോൺ അമർത്തുക",stop:"കേൾക്കുന്നത് നിർത്തുക",speakAgain:"ചോദ്യം വീണ്ടും കേൾക്കുക",useText:"ടെക്സ്റ്റ് ഉപയോഗിക്കുക",save:"സേവ് ചെയ്യുക",saved:"പരാമർശം സേവ് ചെയ്തു.",optional:"ഓപ്ഷണൽ മെഡിക്കൽ ഡോക്യുമെന്റ്",optionalHelp:"റിപ്പോർട്ട്, പ്രിസ്ക്രിപ്ഷൻ അല്ലെങ്കിൽ സ്കാൻ ചേർക്കുക, അല്ലെങ്കിൽ ഒഴിവാക്കുക.",choose:"ഫയലുകൾ തിരഞ്ഞെടുക്കുക",skip:"ഒഴിവാക്കുക — രേഖകൾ ഓപ്ഷണൽ",smart:"നിങ്ങളുടെ നിലവിലെ പ്രശ്നത്തെ അടിസ്ഥാനമാക്കി JARVIS ചില അധിക ചോദ്യങ്ങൾ ചേർത്തു.",urgent:"ഗുരുതരമായ ശ്വാസതടസ്സമോ നെഞ്ചുവേദനയോ ഉണ്ടെങ്കിൽ ഉടൻ വൈദ്യസഹായം തേടുക."},
  pa:{question:"ਸਵਾਲ",of:"ਵਿੱਚੋਂ",back:"ਪਿੱਛੇ",next:"ਅੱਗੇ",review:"ਜਾਂਚ ਕੇ ਸੇਵ ਕਰੋ",selectAll:"ਲਾਗੂ ਹੋਣ ਵਾਲੇ ਸਾਰੇ ਵਿਕਲਪ ਚੁਣੋ।",required:"ਅੱਗੇ ਵਧਣ ਤੋਂ ਪਹਿਲਾਂ ਜਵਾਬ ਦਿਓ।",voiceReady:"ਵੌਇਸ ਮੋਡ ਤਿਆਰ ਹੈ",listening:"ਸੁਣ ਰਿਹਾ ਹਾਂ… ਹੁਣ ਬੋਲੋ",speaking:"JARVIS ਬੋਲ ਰਿਹਾ ਹੈ…",noVoice:"ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਵੌਇਸ ਪਛਾਣ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਟੈਕਸਟ ਵਰਤੋ।",listen:"ਜਵਾਬ ਦੇਣ ਲਈ ਮਾਈਕ ਦਬਾਓ",stop:"ਸੁਣਨਾ ਬੰਦ ਕਰੋ",speakAgain:"ਸਵਾਲ ਦੁਬਾਰਾ ਸੁਣੋ",useText:"ਟੈਕਸਟ ਵਰਤੋ",save:"ਸੇਵ ਕਰੋ",saved:"ਸਲਾਹ ਸੇਵ ਹੋ ਗਈ।",optional:"ਵਿਕਲਪਿਕ ਮੈਡੀਕਲ ਦਸਤਾਵੇਜ਼",optionalHelp:"ਰਿਪੋਰਟ, ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਜਾਂ ਸਕੈਨ ਜੋੜੋ ਜਾਂ ਛੱਡੋ।",choose:"ਫਾਈਲ ਚੁਣੋ",skip:"ਛੱਡੋ — ਦਸਤਾਵੇਜ਼ ਵਿਕਲਪਿਕ ਹਨ",smart:"ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਸਮੱਸਿਆ ਦੇ ਆਧਾਰ 'ਤੇ JARVIS ਨੇ ਕੁਝ ਵਾਧੂ ਸਵਾਲ ਜੋੜੇ ਹਨ।",urgent:"ਗੰਭੀਰ ਸਾਹ ਦੀ ਤਕਲੀਫ਼ ਜਾਂ ਛਾਤੀ ਵਿੱਚ ਤੇਜ਼ ਦਰਦ ਹੋਵੇ ਤਾਂ ਤੁਰੰਤ ਡਾਕਟਰੀ ਮਦਦ ਲਵੋ।"}
};
Object.keys(LANGUAGES).forEach(k=>{if(!T[k])T[k]=T.en});

const commonQuestions = [
  {id:"concern",q:{en:"What is your main current health concern?",hi:"आपकी अभी की मुख्य स्वास्थ्य समस्या क्या है?",bn:"আপনার বর্তমান প্রধান স্বাস্থ্য সমস্যা কী?",te:"మీ ప్రస్తుత ప్రధాన ఆరోగ్య సమస్య ఏమిటి?",mr:"तुमची सध्याची मुख्य आरोग्य समस्या काय आहे?",ta:"உங்கள் தற்போதைய முக்கிய உடல்நலப் பிரச்சினை என்ன?",gu:"તમારી હાલની મુખ્ય આરોગ્ય સમસ્યા શું છે?",kn:"ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮುಖ್ಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಏನು?",ml:"നിങ്ങളുടെ ഇപ്പോഴത്തെ പ്രധാന ആരോഗ്യപ്രശ്നം എന്താണ്?",pa:"ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਮੁੱਖ ਸਿਹਤ ਸਮੱਸਿਆ ਕੀ ਹੈ?"},type:"text",placeholder:{en:"e.g. cough, breathing problem, fever, chest pain, stomach pain...",hi:"जैसे खांसी, सांस की परेशानी, बुखार, सीने में दर्द, पेट दर्द..."}},
  {id:"duration",q:{en:"When did this problem start?",hi:"यह समस्या कब शुरू हुई?",bn:"এই সমস্যা কবে শুরু হয়েছে?",te:"ఈ సమస్య ఎప్పుడు ప్రారంభమైంది?",mr:"ही समस्या कधी सुरू झाली?",ta:"இந்த பிரச்சினை எப்போது தொடங்கியது?",gu:"આ સમસ્યા ક્યારે શરૂ થઈ?",kn:"ಈ ಸಮಸ್ಯೆ ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?",ml:"ഈ പ്രശ്നം എപ്പോൾ തുടങ്ങി?",pa:"ਇਹ ਸਮੱਸਿਆ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਈ?"},type:"choice",options:{en:["Today","2–3 days ago","About a week ago","More than a week ago","Comes and goes"],hi:["आज","2–3 दिन पहले","लगभग एक सप्ताह पहले","एक सप्ताह से अधिक","कभी-कभी होती है"],bn:["আজ","২–৩ দিন আগে","প্রায় এক সপ্তাহ আগে","এক সপ্তাহের বেশি","মাঝে মাঝে হয়"],te:["ఈరోజు","2–3 రోజుల క్రితం","సుమారు వారం క్రితం","వారం కంటే ఎక్కువ","వచ్చి పోతుంది"],mr:["आज","२–३ दिवसांपूर्वी","सुमारे आठवड्यापूर्वी","आठवड्यापेक्षा जास्त","कधीकधी होते"],ta:["இன்று","2–3 நாட்களுக்கு முன்","சுமார் ஒரு வாரம் முன்","ஒரு வாரத்திற்கும் மேல்","வந்து போகிறது"],gu:["આજે","2–3 દિવસ પહેલાં","લગભગ એક અઠવાડિયું પહેલાં","એક અઠવાડિયાથી વધુ","વચ્ચે વચ્ચે થાય છે"],kn:["ಇಂದು","2–3 ದಿನಗಳ ಹಿಂದೆ","ಸುಮಾರು ಒಂದು ವಾರದ ಹಿಂದೆ","ಒಂದು ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು","ಬಂದು ಹೋಗುತ್ತದೆ"],ml:["ഇന്ന്","2–3 ദിവസം മുമ്പ്","ഏകദേശം ഒരാഴ്ച മുമ്പ്","ഒരാഴ്ചയിൽ കൂടുതൽ","ഇടയ്ക്കിടെ വരുന്നു"],pa:["ਅੱਜ","2–3 ਦਿਨ ਪਹਿਲਾਂ","ਲਗਭਗ ਇੱਕ ਹਫ਼ਤਾ ਪਹਿਲਾਂ","ਇੱਕ ਹਫ਼ਤੇ ਤੋਂ ਵੱਧ","ਕਦੇ-ਕਦੇ ਹੁੰਦੀ ਹੈ"]}},
  {id:"severity",q:{en:"How severe is it right now?",hi:"अभी यह समस्या कितनी गंभीर है?",bn:"এখন সমস্যাটি কতটা গুরুতর?",te:"ఇది ఇప్పుడు ఎంత తీవ్రంగా ఉంది?",mr:"आत्ता ही समस्या किती तीव्र आहे?",ta:"இப்போது இது எவ்வளவு தீவிரமாக உள்ளது?",gu:"હમણાં આ સમસ્યા કેટલી ગંભીર છે?",kn:"ಈಗ ಇದು ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ?",ml:"ഇപ്പോൾ ഇത് എത്ര ഗുരുതരമാണ്?",pa:"ਹੁਣ ਇਹ ਸਮੱਸਿਆ ਕਿੰਨੀ ਗੰਭੀਰ ਹੈ?"},type:"choice",options:{en:["Mild","Moderate","Severe","Very severe / urgent"],hi:["हल्की","मध्यम","गंभीर","बहुत गंभीर / तुरंत मदद चाहिए"],bn:["হালকা","মাঝারি","গুরুতর","খুব গুরুতর / জরুরি"],te:["తేలికపాటి","మధ్యస్థ","తీవ్రం","చాలా తీవ్రం / అత్యవసరం"],mr:["सौम्य","मध्यम","तीव्र","अतितीव्र / तातडीचे"],ta:["லேசானது","மிதமானது","தீவிரமானது","மிகவும் தீவிரம் / அவசரம்"],gu:["હળવી","મધ્યમ","ગંભીર","ખૂબ ગંભીર / તાત્કાલિક"],kn:["ಸೌಮ್ಯ","ಮಧ್ಯಮ","ತೀವ್ರ","ತುಂಬಾ ತೀವ್ರ / ತುರ್ತು"],ml:["ലഘുവായത്","മിതമായത്","ഗുരുതരം","വളരെ ഗുരുതരം / അടിയന്തരം"],pa:["ਹਲਕੀ","ਦਰਮਿਆਨੀ","ਗੰਭੀਰ","ਬਹੁਤ ਗੰਭੀਰ / ਤੁਰੰਤ"]}},
  {id:"symptoms",q:{en:"What other symptoms are you having?",hi:"आपको और कौन-कौन से लक्षण हैं?",bn:"আর কী কী উপসর্গ আছে?",te:"ఇంకా ఏ లక్షణాలు ఉన్నాయి?",mr:"आणखी कोणती लक्षणे आहेत?",ta:"வேறு என்ன அறிகுறிகள் உள்ளன?",gu:"બીજા કયા લક્ષણો છે?",kn:"ಬೇರೆ ಯಾವ ಲಕ್ಷಣಗಳಿವೆ?",ml:"മറ്റെന്തെല്ലാം ലക്ഷണങ്ങളുണ്ട്?",pa:"ਹੋਰ ਕਿਹੜੇ ਲੱਛਣ ਹਨ?"},type:"multi",options:{en:["Fever","Cough / cold","Breathing difficulty","Chest pain","Headache","Vomiting / nausea","Loose motions","Dizziness / fainting","Swelling","None of these"],hi:["बुखार","खांसी / जुकाम","सांस लेने में परेशानी","सीने में दर्द","सिरदर्द","उल्टी / जी मिचलाना","दस्त","चक्कर / बेहोशी","सूजन","इनमें से कोई नहीं"]}},
  {id:"conditions",q:{en:"Have you ever been diagnosed with any of these conditions?",hi:"क्या आपको इनमें से कोई बीमारी पहले बताई गई है?",bn:"আপনার কি আগে এসব রোগ নির্ণয় হয়েছে?",te:"ఇవేవైనా వ్యాధులు మీకు గతంలో నిర్ధారించబడ్డాయా?",mr:"यापैकी कोणता आजार तुम्हाला पूर्वी सांगितला आहे का?",ta:"இவற்றில் ஏதேனும் நோய் உங்களுக்கு முன்பு கண்டறியப்பட்டதா?",gu:"આમાંથી કોઈ રોગનું અગાઉ નિદાન થયું છે?",kn:"ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಕಾಯಿಲೆ ನಿಮಗೆ ಹಿಂದೆ ಪತ್ತೆಯಾಗಿದೆಯೇ?",ml:"ഇവയിൽ ഏതെങ്കിലും രോഗം മുമ്പ് കണ്ടെത്തിയിട്ടുണ്ടോ?",pa:"ਕੀ ਤੁਹਾਨੂੰ ਪਹਿਲਾਂ ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕੋਈ ਬਿਮਾਰੀ ਦੱਸੀ ਗਈ ਹੈ?"},help:{en:"Include diabetes, high BP, asthma/COPD, thyroid, heart, kidney, liver disease or TB.",hi:"मधुमेह, हाई BP, अस्थमा/COPD, थायरॉइड, हृदय, किडनी, लिवर या TB शामिल करें।"},type:"multi",options:{en:["Diabetes","High blood pressure","Asthma / COPD","Thyroid disorder","Heart disease","Kidney disease","Liver disease","Tuberculosis (TB) history","None / not known"],hi:["मधुमेह","हाई ब्लड प्रेशर","अस्थमा / COPD","थायरॉइड","हृदय रोग","किडनी रोग","लिवर रोग","टीबी का इतिहास","कोई नहीं / पता नहीं"]}},
  {id:"hospital",q:{en:"Have you ever been hospitalized or had a major surgery?",hi:"क्या आपको कभी अस्पताल में भर्ती होना पड़ा या बड़ी सर्जरी हुई है?",bn:"কখনও হাসপাতালে ভর্তি বা বড় অস্ত্রোপচার হয়েছে কি?",te:"ఎప్పుడైనా ఆసుపత్రిలో చేరారా లేదా పెద్ద శస్త్రచికిత్స జరిగిందా?",mr:"कधी रुग्णालयात दाखल झाले किंवा मोठी शस्त्रक्रिया झाली का?",ta:"மருத்துவமனையில் அனுமதிக்கப்பட்டது அல்லது பெரிய அறுவை சிகிச்சை நடந்ததா?",gu:"ક્યારેય હોસ્પિટલમાં દાખલ થયા છો અથવા મોટી સર્જરી થઈ છે?",kn:"ಎಂದಾದರೂ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿದ್ದೀರಾ ಅಥವಾ ದೊಡ್ಡ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಆಗಿದೆಯೇ?",ml:"ഒരിക്കലെങ്കിലും ആശുപത്രിയിൽ പ്രവേശിപ്പിക്കപ്പെട്ടിട്ടുണ്ടോ അല്ലെങ്കിൽ വലിയ ശസ്ത്രക്രിയ നടത്തിയിട്ടുണ്ടോ?",pa:"ਕੀ ਕਦੇ ਹਸਪਤਾਲ ਵਿੱਚ ਦਾਖਲ ਹੋਏ ਜਾਂ ਵੱਡੀ ਸਰਜਰੀ ਹੋਈ ਹੈ?"},type:"text",placeholder:{en:"If yes, reason and approximate year. Otherwise write No.",hi:"हाँ तो कारण और लगभग वर्ष लिखें। नहीं तो 'नहीं' लिखें।"}},
  {id:"allergy",q:{en:"Do you have any medicine, food or other allergies?",hi:"क्या आपको किसी दवा, भोजन या अन्य चीज़ से एलर्जी है?",bn:"কোনও ওষুধ, খাবার বা অন্য কিছুর অ্যালার্জি আছে?",te:"ఏదైనా మందు, ఆహారం లేదా ఇతర దానికి అలెర్జీ ఉందా?",mr:"कोणत्याही औषधाची, अन्नाची किंवा इतर गोष्टीची ऍलर्जी आहे का?",ta:"மருந்து, உணவு அல்லது வேறு ஏதேனும் ஒவ்வாமை உள்ளதா?",gu:"કોઈ દવા, ખોરાક અથવા અન્ય વસ્તુથી એલર્જી છે?",kn:"ಯಾವುದಾದರೂ ಔಷಧಿ, ಆಹಾರ ಅಥವಾ ಬೇರೆ ಯಾವುದಕ್ಕೂ ಅಲರ್ಜಿ ಇದೆಯೇ?",ml:"ഏതെങ്കിലും മരുന്നിനോടോ ഭക്ഷണത്തോടോ മറ്റേതിനോടോ അലർജി ഉണ്ടോ?",pa:"ਕੀ ਕਿਸੇ ਦਵਾਈ, ਖਾਣੇ ਜਾਂ ਹੋਰ ਚੀਜ਼ ਤੋਂ ਐਲਰਜੀ ਹੈ?"},type:"text",placeholder:{en:"e.g. penicillin, peanuts, dust — or None",hi:"जैसे पेनिसिलिन, मूंगफली, धूल — या 'कोई नहीं'"}},
  {id:"meds",q:{en:"What medicines, inhalers or supplements are you currently taking?",hi:"आप अभी कौन-कौन सी दवाएं, इनहेलर या सप्लीमेंट ले रहे हैं?",bn:"আপনি বর্তমানে কোন ওষুধ, ইনহেলার বা সাপ্লিমেন্ট নিচ্ছেন?",te:"మీరు ప్రస్తుతం ఏ మందులు, ఇన్హేలర్లు లేదా సప్లిమెంట్లు తీసుకుంటున్నారు?",mr:"तुम्ही सध्या कोणती औषधे, इनहेलर किंवा सप्लिमेंट्स घेत आहात?",ta:"நீங்கள் தற்போது எந்த மருந்துகள், இன்ஹேலர்கள் அல்லது சப்பிளிமெண்ட்கள் எடுத்துக்கொள்கிறீர்கள்?",gu:"તમે હાલમાં કઈ દવાઓ, ઇન્હેલર અથવા સપ્લિમેન્ટ લો છો?",kn:"ನೀವು ಈಗ ಯಾವ ಔಷಧಿ, ಇನ್ಹೇಲರ್ ಅಥವಾ ಸಪ್ಲಿಮೆಂಟ್ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಿ?",ml:"നിങ്ങൾ ഇപ്പോൾ ഏത് മരുന്നുകളോ ഇൻഹേലറുകളോ സപ്ലിമെന്റുകളോ കഴിക്കുന്നു?",pa:"ਤੁਸੀਂ ਇਸ ਵੇਲੇ ਕਿਹੜੀਆਂ ਦਵਾਈਆਂ, ਇਨਹੇਲਰ ਜਾਂ ਸਪਲੀਮੈਂਟ ਲੈਂਦੇ ਹੋ?"},type:"text",placeholder:{en:"Name + dose if known, or None",hi:"नाम + मात्रा यदि पता हो, या 'कोई नहीं'"}},
  {id:"family",q:{en:"Is there any important family health history?",hi:"क्या परिवार में कोई महत्वपूर्ण स्वास्थ्य इतिहास है?",bn:"পরিবারে কোনো গুরুত্বপূর্ণ রোগের ইতিহাস আছে?",te:"కుటుంబంలో ముఖ్యమైన ఆరోగ్య చరిత్ర ఉందా?",mr:"कुटुंबात कोणताही महत्त्वाचा आजाराचा इतिहास आहे का?",ta:"குடும்பத்தில் முக்கியமான நோய் வரலாறு உள்ளதா?",gu:"પરિવારમાં કોઈ મહત્વપૂર્ણ રોગનો ઇતિહાસ છે?",kn:"ಕುಟುಂಬದಲ್ಲಿ ಪ್ರಮುಖ ಆರೋಗ್ಯ ಇತಿಹಾಸ ಇದೆಯೇ?",ml:"കുടുംബത്തിൽ പ്രധാനപ്പെട്ട രോഗങ്ങളുടെ ചരിത്രമുണ്ടോ?",pa:"ਕੀ ਪਰਿਵਾਰ ਵਿੱਚ ਕਿਸੇ ਮਹੱਤਵਪੂਰਨ ਬਿਮਾਰੀ ਦਾ ਇਤਿਹਾਸ ਹੈ?"},help:{en:"Examples: diabetes, heart disease, stroke, cancer, high BP, asthma or TB.",hi:"उदाहरण: मधुमेह, हृदय रोग, स्ट्रोक, कैंसर, हाई BP, अस्थमा या TB।"},type:"text",placeholder:{en:"Mention condition and family member, or None",hi:"बीमारी और परिवार के सदस्य का नाम लिखें, या 'कोई नहीं'"}},
  {id:"tobacco",q:{en:"Do you smoke or use tobacco, gutkha, khaini or vaping products?",hi:"क्या आप धूम्रपान या तंबाकू, गुटखा, खैनी या वेपिंग का उपयोग करते हैं?",bn:"আপনি কি ধূমপান, তামাক, গুটখা বা ভ্যাপিং ব্যবহার করেন?",te:"మీరు ధూమపానం, పొగాకు, గుట్కా లేదా వేపింగ్ వాడుతున్నారా?",mr:"तुम्ही धूम्रपान, तंबाखू, गुटखा, खैनी किंवा व्हेपिंग करता का?",ta:"நீங்கள் புகைபிடித்தல், புகையிலை, குட்கா அல்லது வேப்பிங் பயன்படுத்துகிறீர்களா?",gu:"શું તમે ધૂમ્રપાન, તમાકુ, ગુટખા, ખૈની અથવા વેપિંગ કરો છો?",kn:"ನೀವು ಧೂಮಪಾನ, ತಂಬಾಕು, ಗುಟ್ಕಾ ಅಥವಾ ವೇಪಿಂಗ್ ಮಾಡುತ್ತೀರಾ?",ml:"നിങ്ങൾ പുകവലി, പുകയില, ഗുട്ക, ഖൈനി അല്ലെങ്കിൽ വേപ്പിംഗ് ഉപയോഗിക്കുന്നുണ്ടോ?",pa:"ਕੀ ਤੁਸੀਂ ਸਿਗਰਟ, ਤੰਬਾਕੂ, ਗੁਟਖਾ, ਖੈਨੀ ਜਾਂ ਵੇਪਿੰਗ ਕਰਦੇ ਹੋ?"},type:"choice",options:{en:["Never","Currently","Used in the past","Occasionally / socially","Prefer not to say"],hi:["कभी नहीं","अभी करता/करती हूँ","पहले करता/करती था/थी","कभी-कभी","बताना नहीं चाहते"]}},
  {id:"alcohol",q:{en:"Do you drink alcohol?",hi:"क्या आप शराब का सेवन करते हैं?",bn:"আপনি কি অ্যালকোহল পান করেন?",te:"మీరు మద్యం సేవిస్తారా?",mr:"तुम्ही दारू पिता का?",ta:"நீங்கள் மது அருந்துகிறீர்களா?",gu:"શું તમે દારૂ પીવો છો?",kn:"ನೀವು ಮದ್ಯಪಾನ ಮಾಡುತ್ತೀರಾ?",ml:"നിങ്ങൾ മദ്യം കഴിക്കാറുണ്ടോ?",pa:"ਕੀ ਤੁਸੀਂ ਸ਼ਰਾਬ ਪੀਂਦੇ ਹੋ?"},type:"choice",options:{en:["Never","Occasionally","Weekly","Frequently","Prefer not to say"],hi:["कभी नहीं","कभी-कभी","साप्ताहिक","अक्सर","बताना नहीं चाहते"]}},
  {id:"lifestyle",q:{en:"How are your sleep, activity and diet generally?",hi:"आपकी नींद, शारीरिक गतिविधि और खान-पान सामान्यतः कैसा है?",bn:"আপনার ঘুম, শারীরিক কার্যকলাপ ও খাদ্যাভ্যাস কেমন?",te:"మీ నిద్ర, శారీరక చురుకుదనం మరియు ఆహారం సాధారణంగా ఎలా ఉన్నాయి?",mr:"तुमची झोप, शारीरिक हालचाल आणि आहार साधारण कसा आहे?",ta:"உங்கள் தூக்கம், உடற்பயிற்சி மற்றும் உணவு முறை பொதுவாக எப்படி உள்ளது?",gu:"તમારી ઊંઘ, પ્રવૃત્તિ અને આહાર સામાન્ય રીતે કેવા છે?",kn:"ನಿಮ್ಮ ನಿದ್ರೆ, ಚಟುವಟಿಕೆ ಮತ್ತು ಆಹಾರ ಸಾಮಾನ್ಯವಾಗಿ ಹೇಗಿದೆ?",ml:"നിങ്ങളുടെ ഉറക്കം, പ്രവർത്തനം, ഭക്ഷണരീതി പൊതുവെ എങ്ങനെയാണ്?",pa:"ਤੁਹਾਡੀ ਨੀਂਦ, ਸਰਗਰਮੀ ਅਤੇ ਖੁਰਾਕ ਆਮ ਤੌਰ 'ਤੇ ਕਿਵੇਂ ਹੈ?"},type:"text",placeholder:{en:"Example: sleeps 6h, walks 30 min, vegetarian; or describe concerns.",hi:"उदाहरण: 6 घंटे नींद, 30 मिनट चलना, शाकाहारी; या अपनी चिंता बताएं।"}},
  {id:"recent",q:{en:"Have you had any recent tests, reports or doctor consultations?",hi:"क्या हाल में कोई टेस्ट, रिपोर्ट या डॉक्टर से परामर्श हुआ है?",bn:"সম্প্রতি কোনো পরীক্ষা, রিপোর্ট বা ডাক্তারের পরামর্শ হয়েছে?",te:"ఇటీవల ఏదైనా పరీక్ష, రిపోర్ట్ లేదా డాక్టర్ సంప్రదింపు జరిగిందా?",mr:"अलीकडे कोणतीही चाचणी, रिपोर्ट किंवा डॉक्टरांचा सल्ला घेतला आहे का?",ta:"சமீபத்தில் ஏதேனும் பரிசோதனை, அறிக்கை அல்லது மருத்துவர் ஆலோசனை நடந்ததா?",gu:"તાજેતરમાં કોઈ ટેસ્ટ, રિપોર્ટ અથવા ડૉક્ટરની સલાહ લીધી છે?",kn:"ಇತ್ತೀಚೆಗೆ ಯಾವುದೇ ಪರೀಕ್ಷೆ, ವರದಿ ಅಥವಾ ವೈದ್ಯರ ಸಲಹೆ ಪಡೆದಿದ್ದೀರಾ?",ml:"സമീപകാലത്ത് എന്തെങ്കിലും ടെസ്റ്റോ റിപ്പോർട്ടോ ഡോക്ടർ കൺസൾട്ടേഷനോ ഉണ്ടായിട്ടുണ്ടോ?",pa:"ਕੀ ਹਾਲ ਹੀ ਵਿੱਚ ਕੋਈ ਟੈਸਟ, ਰਿਪੋਰਟ ਜਾਂ ਡਾਕਟਰ ਨਾਲ ਸਲਾਹ ਹੋਈ ਹੈ?"},type:"text",placeholder:{en:"Mention known findings or None",hi:"पता हो तो रिपोर्ट/नतीजे लिखें या 'कोई नहीं'"}},
  {id:"other",q:{en:"Is there anything else important about your health?",hi:"क्या आपके स्वास्थ्य के बारे में कोई और महत्वपूर्ण बात है?",bn:"আপনার স্বাস্থ্য সম্পর্কে আর কোনো গুরুত্বপূর্ণ তথ্য আছে?",te:"మీ ఆరోగ్యం గురించి మరేదైనా ముఖ్యమైన విషయం ఉందా?",mr:"तुमच्या आरोग्याबद्दल आणखी काही महत्त्वाचे सांगायचे आहे का?",ta:"உங்கள் உடல்நலம் பற்றி வேறு முக்கியமான தகவல் உள்ளதா?",gu:"તમારા સ્વાસ્થ્ય વિશે બીજી કોઈ મહત્વપૂર્ણ વાત છે?",kn:"ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಬೇರೆ ಯಾವುದಾದರೂ ಪ್ರಮುಖ ಮಾಹಿತಿ ಇದೆಯೇ?",ml:"നിങ്ങളുടെ ആരോഗ്യത്തെക്കുറിച്ച് മറ്റെന്തെങ്കിലും പ്രധാനപ്പെട്ട കാര്യമുണ്ടോ?",pa:"ਤੁਹਾਡੀ ਸਿਹਤ ਬਾਰੇ ਹੋਰ ਕੋਈ ਮਹੱਤਵਪੂਰਨ ਗੱਲ ਹੈ?"},type:"text",placeholder:{en:"Anything we did not ask",hi:"जो हमने नहीं पूछा, वह कोई भी महत्वपूर्ण जानकारी"}}
];

const adaptive = {
  respiratory:[
    {id:"resp_breath",q:{en:"When you feel breathless, does it happen at rest, while walking, or mainly at night?",hi:"सांस फूलना आराम में, चलने पर या मुख्यतः रात में होता है?"},type:"choice",options:{en:["At rest","Walking / climbing stairs","Mostly at night","With exercise","Only during episodes"],hi:["आराम में","चलने/सीढ़ी चढ़ने पर","मुख्यतः रात में","व्यायाम के साथ","केवल दौरे के समय"]}},
    {id:"resp_smoke",q:{en:"Have you smoked or used tobacco for a long time? If yes, roughly how much?",hi:"क्या आपने लंबे समय तक धूम्रपान या तंबाकू का उपयोग किया है? यदि हाँ, लगभग कितना?"},type:"text",placeholder:{en:"Example: 5 cigarettes/day for 10 years; or No",hi:"उदाहरण: 10 साल से 5 सिगरेट/दिन; या नहीं"}},
    {id:"resp_tb",q:{en:"Have you or a close family member ever had tuberculosis (TB), long-lasting cough, or TB treatment?",hi:"क्या आपको या परिवार के किसी करीबी सदस्य को कभी TB, लंबे समय की खांसी या TB का इलाज हुआ है?"},type:"text",placeholder:{en:"Mention yes/no and details if known",hi:"हाँ/नहीं और जानकारी लिखें"}},
    {id:"resp_wheeze",q:{en:"Do you have wheezing, chest tightness, phlegm, or repeated breathing episodes?",hi:"क्या सीटी जैसी सांस, सीने में जकड़न, बलगम या बार-बार सांस की परेशानी होती है?"},type:"multi",options:{en:["Wheezing","Chest tightness","Phlegm","Repeated episodes","None"],hi:["सीटी जैसी सांस","सीने में जकड़न","बलगम","बार-बार परेशानी","कोई नहीं"]}}
  ],
  cardiac:[
    {id:"cardiac_pain",q:{en:"If you have chest discomfort, where is it and does it spread to the arm, shoulder, back or jaw?",hi:"अगर सीने में तकलीफ है तो कहाँ है और क्या हाथ, कंधे, पीठ या जबड़े तक जाती है?"},type:"text",placeholder:{en:"Describe location and spread, if any",hi:"जगह और फैलने की जानकारी दें"}},
    {id:"cardiac_exertion",q:{en:"Does the chest discomfort or breathlessness appear with walking or climbing stairs and improve with rest?",hi:"क्या चलने या सीढ़ी चढ़ने पर सीने की तकलीफ/सांस फूलना बढ़ता है और आराम करने पर कम होता है?"},type:"choice",options:{en:["Yes","No","Sometimes","Not sure"],hi:["हाँ","नहीं","कभी-कभी","पता नहीं"]}},
    {id:"cardiac_risk",q:{en:"Do you have high BP, diabetes, high cholesterol, or a family history of early heart disease?",hi:"क्या आपको हाई BP, मधुमेह, हाई कोलेस्ट्रॉल या कम उम्र में हृदय रोग का पारिवारिक इतिहास है?"},type:"multi",options:{en:["High BP","Diabetes","High cholesterol","Family heart disease","None / not known"],hi:["हाई BP","मधुमेह","हाई कोलेस्ट्रॉल","परिवार में हृदय रोग","कोई नहीं / पता नहीं"]}}
  ],
  diabetes:[
    {id:"sugar_reading",q:{en:"Do you know your recent blood sugar or HbA1c value?",hi:"क्या आपको हाल की ब्लड शुगर या HbA1c की वैल्यू पता है?"},type:"text",placeholder:{en:"Example: fasting 140, HbA1c 7.2; or Not known",hi:"उदाहरण: फास्टिंग 140, HbA1c 7.2; या पता नहीं"}},
    {id:"sugar_symptoms",q:{en:"Have you noticed increased thirst, frequent urination, increased hunger, weight change, or slow-healing wounds?",hi:"क्या ज्यादा प्यास, बार-बार पेशाब, ज्यादा भूख, वजन में बदलाव या घाव देर से भरना हुआ है?"},type:"multi",options:{en:["More thirst","Frequent urination","More hunger","Weight change","Slow-healing wound","None"],hi:["ज्यादा प्यास","बार-बार पेशाब","ज्यादा भूख","वजन में बदलाव","घाव देर से भरना","कोई नहीं"]}},
    {id:"sugar_meds",q:{en:"If you have diabetes, do you miss medicines or insulin doses sometimes?",hi:"अगर मधुमेह है, तो क्या कभी दवा या इंसुलिन की डोज छूट जाती है?"},type:"choice",options:{en:["Never","Sometimes","Often","I do not take diabetes medicine"],hi:["कभी नहीं","कभी-कभी","अक्सर","मधुमेह की दवा नहीं लेता/लेती"]}}
  ],
  bp:[
    {id:"bp_reading",q:{en:"Do you know your recent blood pressure reading?",hi:"क्या आपको हाल की ब्लड प्रेशर रीडिंग पता है?"},type:"text",placeholder:{en:"Example: 150/95; or Not known",hi:"उदाहरण: 150/95; या पता नहीं"}},
    {id:"bp_adherence",q:{en:"If you take BP medicine, do you miss doses or stop it when you feel better?",hi:"अगर BP की दवा लेते हैं, तो क्या डोज छूटती है या बेहतर लगने पर दवा बंद कर देते हैं?"},type:"choice",options:{en:["Never","Sometimes","Often","I do not take BP medicine"],hi:["कभी नहीं","कभी-कभी","अक्सर","BP की दवा नहीं लेता/लेती"]}},
    {id:"bp_symptoms",q:{en:"Have you had severe headache, vision change, weakness/numbness, chest pain, or breathlessness with the BP problem?",hi:"BP की समस्या के साथ तेज सिरदर्द, नजर में बदलाव, कमजोरी/सुन्नपन, सीने में दर्द या सांस की परेशानी हुई है?"},type:"multi",options:{en:["Severe headache","Vision change","Weakness / numbness","Chest pain","Breathlessness","None"],hi:["तेज सिरदर्द","नजर में बदलाव","कमजोरी / सुन्नपन","सीने में दर्द","सांस की परेशानी","कोई नहीं"]}}
  ],
  fever:[
    {id:"fever_temp",q:{en:"What is the highest temperature you measured, if any?",hi:"अगर तापमान मापा है तो सबसे अधिक कितना था?"},type:"text",placeholder:{en:"Example: 102°F; or Not measured",hi:"उदाहरण: 102°F; या नहीं मापा"}},
    {id:"fever_infection",q:{en:"Do you have cough, sore throat, burning urine, loose motions, rash, or recent sick contact?",hi:"क्या खांसी, गले में दर्द, पेशाब में जलन, दस्त, दाने या हाल में किसी बीमार व्यक्ति से संपर्क हुआ है?"},type:"multi",options:{en:["Cough / sore throat","Burning urine","Loose motions","Rash","Sick contact","None"],hi:["खांसी / गले में दर्द","पेशाब में जलन","दस्त","दाने","बीमार व्यक्ति से संपर्क","कोई नहीं"]}},
    {id:"fever_travel",q:{en:"Have you recently travelled, had many mosquito bites, or lived in an area with dengue/malaria risk?",hi:"क्या हाल में यात्रा, बहुत मच्छर के काटने या डेंगू/मलेरिया वाले क्षेत्र में रहना हुआ है?"},type:"choice",options:{en:["Yes","No","Not sure"],hi:["हाँ","नहीं","पता नहीं"]}}
  ],
  stomach:[
    {id:"abd_location",q:{en:"Where is the stomach or abdominal pain, and does it move to the back or shoulder?",hi:"पेट का दर्द कहाँ है और क्या पीठ या कंधे तक जाता है?"},type:"text",placeholder:{en:"Upper/lower/right/left/middle + spread if any",hi:"ऊपर/नीचे/दाएं/बाएं/बीच + फैलने की जानकारी"}},
    {id:"abd_food",q:{en:"Is it related to food, bowel movement, acidity, or constipation?",hi:"क्या दर्द खाने, मल त्याग, गैस/एसिडिटी या कब्ज से जुड़ा है?"},type:"multi",options:{en:["After food","With acidity / burning","With bowel movement","Constipation","Diarrhoea","Not related"],hi:["खाने के बाद","एसिडिटी / जलन","मल त्याग के साथ","कब्ज","दस्त","संबंध नहीं"]}},
    {id:"abd_red",q:{en:"Any repeated vomiting, blood in stool/vomit, black stool, yellow eyes, or severe worsening pain?",hi:"क्या बार-बार उल्टी, मल/उल्टी में खून, काला मल, आंखें पीली या दर्द बहुत बढ़ना है?"},type:"multi",options:{en:["Repeated vomiting","Blood","Black stool","Yellow eyes","Severe worsening pain","None"],hi:["बार-बार उल्टी","खून","काला मल","आंखें पीली","बहुत बढ़ता दर्द","कोई नहीं"]}}
  ],
  headache:[
    {id:"head_pattern",q:{en:"Where is the headache and is it sudden, one-sided, throbbing, or different from your usual headaches?",hi:"सिरदर्द कहाँ है और क्या अचानक, एक तरफ, धड़कने जैसा या सामान्य से अलग है?"},type:"text",placeholder:{en:"Describe the pattern",hi:"दर्द का तरीका बताएं"}},
    {id:"head_neuro",q:{en:"Any weakness/numbness, difficulty speaking, vision change, confusion, fainting, or seizure?",hi:"क्या कमजोरी/सुन्नपन, बोलने में दिक्कत, नजर में बदलाव, भ्रम, बेहोशी या दौरा हुआ?"},type:"multi",options:{en:["Weakness / numbness","Speech difficulty","Vision change","Confusion","Fainting","Seizure","None"],hi:["कमजोरी / सुन्नपन","बोलने में दिक्कत","नजर में बदलाव","भ्रम","बेहोशी","दौरा","कोई नहीं"]}},
    {id:"head_trigger",q:{en:"Is it linked with poor sleep, stress, dehydration, screen use, or missed meals?",hi:"क्या यह कम नींद, तनाव, पानी की कमी, स्क्रीन या खाना छूटने से जुड़ा है?"},type:"multi",options:{en:["Poor sleep","Stress","Dehydration","Long screen use","Missed meals","Not sure"],hi:["कम नींद","तनाव","पानी की कमी","लंबे समय स्क्रीन","खाना छूटा","पता नहीं"]}}
  ]
};

function pickText(obj){return typeof obj==="string"?obj:(obj[jarvisLanguage]||obj.en)}
function pickOptions(obj){return obj[jarvisLanguage]||obj.en}
function detectCategories(text){
  const s=(text||"").toLowerCase(); const cats=[];
  if(/breath|breathing|breathless|asthma|cough|coughing|wheez|phlegm|khansi|khaansi| सांस|खांसी|अस्थमा|दम/.test(s))cats.push("respiratory");
  if(/chest|heart|palpitation|angina|सीने|दिल|धड़कन/.test(s))cats.push("cardiac");
  if(/diabet|sugar|glucose|शुगर|मधुमेह/.test(s))cats.push("diabetes");
  if(/bp|blood pressure|hypertension|pressure|ब्लड प्रेशर|बीपी|हाई bp/.test(s))cats.push("bp");
  if(/fever|temperature|dengue|malaria|बुखार|डेंगू|मलेरिया/.test(s))cats.push("fever");
  if(/stomach|abdomen|abdominal|gastric|acidity|vomit|diarr|पेट|एसिडिटी|उल्टी|दस्त/.test(s))cats.push("stomach");
  if(/headache|migraine|head pain|सिरदर्द|माइग्रेन/.test(s))cats.push("headache");
  return [...new Set(cats)];
}
function buildQuestionFlow(concern=""){
  const base=[...commonQuestions.slice(0,4)];
  const categories=detectCategories(concern);
  const smart=categories.flatMap(c=>adaptive[c]||[]);
  activeQuestions=[...base,...smart,...commonQuestions.slice(4)];
  // Remove duplicate question IDs while preserving order; this prevents repeated adaptive questions.
  const seen=new Set(); activeQuestions=activeQuestions.filter(q=>{if(seen.has(q.id))return false;seen.add(q.id);return true;});
  return categories;
}

const documents = [
  {name:"Blood Report.pdf", size:"1.2 MB", date:"10 May 2026", type:"pdf"},
  {name:"X-Ray Chest.png", size:"2.5 MB", date:"08 May 2026", type:"image"},
  {name:"Prescription.docx", size:"0.8 MB", date:"05 May 2026", type:"doc"},
  {name:"ECG Report.pdf", size:"1.5 MB", date:"01 May 2026", type:"pdf"}
];

function qs(s){return document.querySelector(s)}
function qsa(s){return [...document.querySelectorAll(s)]}
function initials(name){return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}

function showToast(message){
  const wrap=qs("#toastContainer");
  const el=document.createElement("div");
  el.className="toast align-items-center border-0 show";
  el.innerHTML=`<div class="d-flex"><div class="toast-body"><i class="bi bi-check-circle-fill me-2"></i>${message}</div><button class="btn-close me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
  wrap.appendChild(el); setTimeout(()=>el.remove(),3200);
}

function login(){
  const value=qs("#aadhaarInput").value.trim();
  const valid=authMethod==="aadhaar" ? value.replace(/\D/g,"").length===12 : /^[A-Za-z0-9._-]{4,64}$/.test(value);
  if(!valid){showToast(authMethod==="aadhaar"?"Enter any 12-digit demo Aadhaar number.":"Enter a valid demo ABHA Address."); return}
  currentRole=qsa(".role-btn").find(b=>b.classList.contains("active")).dataset.role;
  authVerified=true; verifiedCredential=value;
  qs("#verifiedIdentity").textContent=(authMethod==="aadhaar"?"Aadhaar":"ABHA Address")+" verified • "+(authMethod==="aadhaar"?"•••• "+value.replace(/\D/g,"").slice(-4):value);
  qs("#aadhaarInput").disabled=true; qs("#loginBtn").classList.add("d-none"); qs("#passwordStep").classList.remove("d-none"); qs("#passwordBackBtn").classList.remove("d-none"); qs("#signupPrompt").classList.add("d-none"); qs("#passwordInput").focus();
}
function completePasswordLogin(){
  if(!authVerified){return login()}
  const password=qs("#passwordInput").value.trim();
  if(!password){showToast("Enter your password / PIN to continue.");return}
  qs("#loginView").classList.add("d-none"); qs("#appView").classList.remove("d-none");
  history.pushState({screen:"app",role:currentRole,page:currentRole==="doctor"?"dashboard":"home"},"",location.href);
  setupRole();
}
function resetAuthStep(){
  authVerified=false; verifiedCredential=""; qs("#aadhaarInput").disabled=false; qs("#loginBtn").classList.remove("d-none"); qs("#passwordStep").classList.add("d-none"); qs("#passwordBackBtn").classList.add("d-none"); qs("#signupPrompt").classList.remove("d-none"); qs("#passwordInput").value="";
}
function openRegistration(){
  qs("#loginCard").classList.add("registration-open"); qs("#registrationPanel").classList.remove("d-none");
}
function closeRegistration(){
  qs("#registrationPanel").classList.add("d-none"); qs("#loginCard").classList.remove("registration-open");
}
function registerUser(e){
  e.preventDefault();
  const identity=qs("#regIdentity").value.trim(); const method=qs("#regAuthMethod").value;
  const validIdentity=method==="aadhaar" ? identity.replace(/\D/g,"").length===12 : /^[A-Za-z0-9._-]{4,64}$/.test(identity);
  const mobile=qs("#regMobile").value.replace(/\D/g,"");
  const p1=qs("#regPassword").value, p2=qs("#regPassword2").value;
  if(!validIdentity){showToast(method==="aadhaar"?"Enter a valid 12-digit demo Aadhaar.":"Enter a valid demo ABHA Address.");return}
  if(mobile.length!==10){showToast("Enter a valid 10-digit mobile number.");return}
  if(p1.length<4 || p1!==p2){showToast("Passwords must match and contain at least 4 characters.");return}
  const user={name:qs("#regName").value.trim(),dob:qs("#regDob").value,gender:qs("#regGender").value,mobile,location:qs("#regLocation").value.trim(),blood:qs("#regBlood").value,height:qs("#regHeight").value,weight:qs("#regWeight").value,emergency:qs("#regEmergency").value.trim(),conditions:qs("#regConditions").value.trim()||"None",allergies:qs("#regAllergies").value.trim()||"None",identityMethod:method,identity, password:p1, id:"JS-"+String(Math.floor(10000+Math.random()*89999))};
  localStorage.setItem("js_registered_user",JSON.stringify(user));
  showToast("Account created. Your JeevanSetu ID is "+user.id);
  closeRegistration(); qs("#aadhaarInput").value=identity; authMethod=method; qsa(".auth-method").forEach(b=>b.classList.toggle("active",b.dataset.auth===method)); qs("#authLabel").textContent=method==="abha"?"ABHA Address":"Aadhaar number"; qs("#authInputIcon").className=method==="abha"?"bi bi-heart-pulse":"bi bi-fingerprint"; resetAuthStep();
  qs("#signupPrompt").classList.remove("d-none");
}

function setupRole(){
  navigationStack=[{role:currentRole,page:currentRole==="doctor"?"dashboard":"home"}];
  const isDoctor=currentRole==="doctor";
  qs("#doctorPages").classList.toggle("d-none",!isDoctor);
  qs("#patientPages").classList.toggle("d-none",isDoctor);
  qs("#patientWellnessNav").classList.toggle("d-none",isDoctor);
  qs("#wellnessPanel").classList.add("d-none");
  qs("#sidebarRole").innerHTML=isDoctor?'<i class="bi bi-person-badge"></i> Doctor portal':'<i class="bi bi-person"></i> Patient portal';
  qs("#sidebarUser").textContent=isDoctor?"Dr. Anil Verma":"Ravi Kumar";
  qs("#topName").textContent=isDoctor?"Dr. Anil Verma":"Ravi Kumar";
  qs("#topRole").textContent=isDoctor?"Doctor":"Patient";
  qs("#topAvatar").textContent=isDoctor?"AV":"RK";
  qs("#sidebarNav").innerHTML=isDoctor?`
    <button class="nav-item-btn active" data-page="dashboard"><i class="bi bi-grid-1x2-fill"></i> Dashboard</button>
    <button class="nav-item-btn" data-page="patients"><i class="bi bi-people-fill"></i> My patients</button>
    <button class="nav-item-btn" data-page="reports"><i class="bi bi-file-earmark-medical-fill"></i> Reports</button>
  `:`
    <button class="nav-item-btn active" data-page="home"><i class="bi bi-grid-1x2-fill"></i> My health</button>
    <button class="nav-item-btn" data-page="consultation"><i class="bi bi-stars"></i> JARVIS check</button>
    <button class="nav-item-btn" data-page="documents"><i class="bi bi-folder2-open"></i> Documents</button>
    <button class="nav-item-btn" data-page="history"><i class="bi bi-clock-history"></i> History</button>
    <button class="nav-item-btn" data-page="profile"><i class="bi bi-person-circle"></i> Profile</button>
  `;
  qsa(".nav-item-btn").forEach(btn=>btn.onclick=()=>{ if(isDoctor) showDoctorPage(btn.dataset.page); else showPatientPage(btn.dataset.page); });
  if(isDoctor){renderPatients(); renderAttention(); showDoctorPage("dashboard",true)}
  else {renderDocuments(); renderHistory(); renderRecent(); showPatientPage("home",true)}
}

function recordNavigation(role,page){
  if(suppressNavigation) return;
  navigationStack.push({role,page});
  history.pushState({screen:"app",role,page},"",location.href);
}
function showDoctorPage(name, fromPop=false){
  const map={dashboard:"doctorDashboard",patients:"allPatients",reports:"doctorReports",detail:"patientDetail"};
  qsa("#doctorPages .page").forEach(p=>p.classList.remove("active-page"));
  qs("#"+map[name]).classList.add("active-page");
  qsa(".nav-item-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  qs("#pageTitle").textContent={dashboard:"Dashboard",patients:"My patients",reports:"Reports",detail:"Patient details"}[name]||"Dashboard";
  qs(".sidebar").classList.remove("open");
  if(!fromPop) recordNavigation("doctor",name);
}
function showPatientPage(name, fromPop=false){
  const map={home:"patientHome",consultation:"consultationPage",documents:"documentsPage",history:"historyPage",profile:"patientProfile"};
  qsa("#patientPages .page").forEach(p=>p.classList.remove("active-page"));
  qs("#"+map[name]).classList.add("active-page");
  qsa(".nav-item-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  qs("#pageTitle").textContent={home:"My health",consultation:"JARVIS health check",documents:"Medical documents",history:"Consultation history",profile:"My profile"}[name];
  qs(".sidebar").classList.remove("open");
  if(!fromPop) recordNavigation("patient",name);
}
function goBackInApp(){
  if(navigationStack.length>1) history.back();
  else showToast(currentRole==="doctor"?"You are already at the first dashboard tab.":"You are already at the first health tab.");
}

function patientRow(p,i){
  return `<tr>
    <td>${i+1}</td>
    <td><div class="d-flex align-items-center gap-2"><div class="avatar avatar-sm">${p.initials}</div><div><span class="patient-name">${p.name}</span><span class="patient-sub"><span class="health-id-badge"><i class="bi bi-fingerprint"></i>${p.id}</span></span></div></div></td>
    <td>${p.age} / ${p.gender[0]}</td><td>${p.visit}</td><td>${p.condition}</td>
    <td><span class="status-pill ${p.status==="stable"?"stable":"attention"}"><i class="bi ${p.status==="stable"?"bi-check-circle-fill":"bi-exclamation-circle-fill"}"></i>${p.status==="stable"?"Stable":"Attention"}</span></td>
    <td><button class="row-action" onclick="showPatientDetail('${p.id}')"><i class="bi bi-chevron-right"></i></button></td>
  </tr>`;
}
function renderPatients(list=patients){qs("#patientTableBody").innerHTML=list.map((p,i)=>patientRow(p,i)).join("");qs("#allPatientBody").innerHTML=list.map((p,i)=>patientRow(p,i)).join("")}
function renderAttention(){
  qs("#attentionList").innerHTML=patients.filter(p=>p.status==="attention").slice(0,4).map(p=>`
    <div class="attention-item" onclick="showPatientDetail('${p.id}')" style="cursor:pointer">
      <div class="avatar avatar-sm">${p.initials}</div><div><strong>${p.name}</strong><small>${p.condition} • Last visit ${p.visit}</small></div><span class="status-dot"></span>
    </div>`).join("");
}
function openPatient(id){
  selectedPatient=patients.find(p=>p.id===id)||patients[0];
  qs("#modalPatientName").textContent=selectedPatient.name;
  qs("#modalPatientBody").innerHTML=`
    <div class="profile-banner mb-3"><div class="avatar avatar-xl">${selectedPatient.initials}</div><div class="profile-main"><h3>${selectedPatient.name}</h3><div class="profile-tags"><span>${selectedPatient.age} years • ${selectedPatient.gender}</span><span>${selectedPatient.blood}</span><span>${selectedPatient.condition}</span></div></div></div>
    <div class="row g-3"><div class="col-md-4"><div class="panel"><small class="text-muted">Allergies</small><h6>${selectedPatient.allergies}</h6></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Medication</small><h6>${selectedPatient.meds}</h6></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Last visit</small><h6>${selectedPatient.visit}</h6></div></div></div>
    <h6 class="mt-4">Past details</h6>${selectedPatient.history.map(h=>`<div class="history-row"><div class="date-box"><strong>${h[0].split(" ")[0]}</strong><small>${h[0].split(" ").slice(1).join(" ")}</small></div><div><h5>${h[1]}</h5><p>${h[2]} • ${h[3]}</p></div></div>`).join("")}`;
  new bootstrap.Modal(qs("#patientModal")).show();
}
function renderDetail(tab="summary"){
  const p=selectedPatient;
  if(tab==="summary"){
    qs("#detailContent").innerHTML=`<div class="row g-3"><div class="col-md-4"><div class="panel"><small class="text-muted">Blood group</small><h5>${p.blood}</h5></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Allergies</small><h5>${p.allergies}</h5></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Medication</small><h5>${p.meds}</h5></div></div></div><div class="panel mt-3"><h5 class="mb-3">Recent clinical history</h5>${p.history.map(h=>`<div class="history-row"><div class="date-box"><strong>${h[0].split(" ")[0]}</strong><small>${h[0].split(" ")[1]} ${h[0].split(" ")[2]}</small></div><div><h5>${h[1]}</h5><p>${h[2]} • ${h[3]}</p></div></div>`).join("")}</div>`;
  } else {
    const labels={visits:"Past visits",reports:"Reports",prescriptions:"Prescriptions"};
    qs("#detailContent").innerHTML=`<div class="panel"><h5>${labels[tab]}</h5><p class="text-muted small mt-2">Frontend demo data for ${p.name}. This section is ready to connect to your backend/database.</p>${p.history.map(h=>`<div class="history-row"><div class="date-box"><strong>${h[0].split(" ")[0]}</strong><small>${h[0].split(" ")[1]}</small></div><div><h5>${h[1]}</h5><p>${h[2]} • ${h[3]}</p></div><button class="icon-btn ms-auto"><i class="bi bi-eye"></i></button></div>`).join("")}</div>`;
  }
}
function showPatientDetail(id){
  selectedPatient=patients.find(p=>p.id===id)||patients[0];
  qs("#detailName").textContent=selectedPatient.name;qs("#profileName").textContent=selectedPatient.name;
  qs("#detailMeta").textContent=`${selectedPatient.age} years • ${selectedPatient.gender} • Patient ID: ${selectedPatient.id}`;
  qs("#detailAvatar").textContent=selectedPatient.initials;
  qs("#detailStatus").className=`status-pill ${selectedPatient.status==="stable"?"stable":"attention"}`;
  qs("#detailStatus").innerHTML=`<i class="bi ${selectedPatient.status==="stable"?"bi-check-circle-fill":"bi-exclamation-circle-fill"}"></i>${selectedPatient.status==="stable"?"Stable":"Needs attention"}`;
  renderDetail(); showDoctorPage("detail");
}
function startConsultation(){
  questionIndex=0;consultationAnswers=[];currentConcern="";inputMode="text";buildQuestionFlow("");showPatientPage("consultation");renderQuestion();
}
function setVoiceStatus(type,text){const el=qs("#voiceStatus");if(!el)return;el.className="voice-status "+(type||"");el.innerHTML=`<i class="bi ${type==="listening"?"bi-mic-fill":type==="speaking"?"bi-volume-up-fill":"bi-check-circle"}"></i><span>${text}</span>`}
function speakText(text){
  if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text);u.lang=LANGUAGES[jarvisLanguage].speech;u.rate=.9;u.pitch=1;
  const voices=window.speechSynthesis.getVoices();const prefix=LANGUAGES[jarvisLanguage].speech.split("-")[0];const v=voices.find(x=>x.lang.toLowerCase().startsWith(prefix));if(v)u.voice=v;
  u.onstart=()=>setVoiceStatus("speaking",T[jarvisLanguage].speaking);u.onend=()=>setVoiceStatus("",T[jarvisLanguage].voiceReady);window.speechSynthesis.speak(u);
}
function initRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setVoiceStatus("",T[jarvisLanguage].noVoice);return null}
  const r=new SR();r.lang=LANGUAGES[jarvisLanguage].speech;r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  r.onstart=()=>{setVoiceStatus("listening",T[jarvisLanguage].listening);const b=qs("#voiceMic");if(b)b.classList.add("listening")};
  r.onresult=e=>{let text="";for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;const out=qs("#voiceTranscript");if(out)out.textContent=text; if(e.results[e.results.length-1].isFinal){consultationAnswers[questionIndex]=text.trim(); if(qs("#answerInput"))qs("#answerInput").value=text.trim(); if(activeQuestions[questionIndex]?.type==="text")showToast("Voice answer captured. Tap Next when ready.");}};
  r.onerror=e=>{setVoiceStatus("",e.error==="not-allowed"?"Microphone permission denied":T[jarvisLanguage].voiceReady);const b=qs("#voiceMic");if(b)b.classList.remove("listening")};
  r.onend=()=>{setVoiceStatus("",T[jarvisLanguage].voiceReady);const b=qs("#voiceMic");if(b)b.classList.remove("listening")};return r;
}
function toggleListening(){
  if(!recognition)recognition=initRecognition();if(!recognition)return;
  if(qs("#voiceMic")?.classList.contains("listening")){recognition.stop();return}
  recognition.lang=LANGUAGES[jarvisLanguage].speech;recognition.start();
}
function setInputMode(mode){inputMode=mode;qsa(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));renderQuestion();if(mode==="voice")speakText(pickText(activeQuestions[questionIndex].q))}
function renderQuestion(){
  const q=activeQuestions[questionIndex]||commonQuestions[0],total=activeQuestions.length,pct=Math.round(((questionIndex+1)/total)*100);const lang=T[jarvisLanguage]||T.en;
  qs("#questionCounter").textContent=`${lang.question} ${questionIndex+1} ${lang.of} ${total}`;qs("#progressPercent").textContent=pct+"%";qs("#questionProgress").style.width=pct+"%";
  const categories=detectCategories(currentConcern);const smartNote=questionIndex===4&&categories.length?`<div class="adaptive-note"><i class="bi bi-stars me-1"></i>${lang.smart}</div>`:"";
  let html=smartNote+`<div class="question-title">${pickText(q.q)}</div>${q.help?`<div class="question-help">${pickText(q.help)}</div>`:""}`;
  const saved=consultationAnswers[questionIndex];
  if(q.type==="text"){
    html+=`<textarea id="answerInput" rows="4" placeholder="${pickText(q.placeholder||{en:"Type your answer"})}">${typeof saved==="string"?saved:""}</textarea>`;
    if(inputMode==="voice")html+=`<div class="voice-answer mt-3"><p>${lang.listen}</p><button id="voiceMic" class="voice-btn" onclick="toggleListening()"><i class="bi bi-mic-fill"></i></button><div id="voiceTranscript" class="transcript">${saved||""}</div><button class="speak-again" onclick="speakText(pickText(activeQuestions[questionIndex].q))"><i class="bi bi-volume-up me-1"></i>${lang.speakAgain}</button></div>`;
  } else if(q.type==="choice"||q.type==="multi"){
    const selected=Array.isArray(saved)?saved:(saved?[saved]:[]);const opts=pickOptions(q.options);html+=`<div class="${q.type==="multi"?"choice-grid multi-choice-grid":"choice-grid"}">${opts.map(o=>`<button class="choice-btn ${selected.includes(o)?"selected":""}" onclick="chooseAnswer(this,${JSON.stringify(o)},${q.type==="multi"})">${o}</button>`).join("")}</div>${q.type==="multi"?`<div class="question-help mt-3">${lang.selectAll}</div>`:""}`;
    if(inputMode==="voice")html+=`<div class="voice-answer mt-3"><p>${lang.listen}</p><button id="voiceMic" class="voice-btn" onclick="toggleListening()"><i class="bi bi-mic-fill"></i></button><div id="voiceTranscript" class="transcript">${Array.isArray(saved)?saved.join(", "):saved||""}</div><button class="speak-again" onclick="speakText(pickText(activeQuestions[questionIndex].q))"><i class="bi bi-volume-up me-1"></i>${lang.speakAgain}</button></div>`;
  } else if(q.type==="upload"){
    html+=`<div class="optional-upload-box"><div class="upload-icon"><i class="bi bi-cloud-arrow-up-fill"></i></div><div><strong>${lang.optional}</strong><p>${lang.optionalHelp}</p></div><input id="jarvisFileInput" type="file" hidden multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"><button class="btn btn-outline-primary btn-sm" onclick="qs('#jarvisFileInput').click()">${lang.choose}</button><div id="jarvisFileNames" class="file-names">${saved?.length?saved.join(", "):""}</div></div><button class="skip-upload" onclick="skipCurrentQuestion()">${lang.skip}</button>`;
  }
  if((q.id==="severity"&&Array.isArray(saved)&&saved[0]?.toLowerCase().includes("urgent")) || (q.id==="severity"&&typeof saved==="string"&&/very severe|तुरंत|urgent/i.test(saved)))html+=`<div class="urgent-banner"><i class="bi bi-exclamation-triangle-fill me-1"></i>${lang.urgent}</div>`;
  html+=`<div class="question-actions"><button class="btn btn-light" ${questionIndex===0?"disabled":""} onclick="prevQuestion()">${lang.back}</button><button class="btn btn-primary" onclick="nextQuestion()">${questionIndex===total-1?lang.review:lang.next} <i class="bi bi-arrow-right ms-1"></i></button></div>`;
  qs("#questionArea").innerHTML=html;
  if(qs("#jarvisFileInput"))qs("#jarvisFileInput").addEventListener("change",e=>{consultationAnswers[questionIndex]=[...e.target.files].map(f=>f.name);qs("#jarvisFileNames").textContent=consultationAnswers[questionIndex].join(", ")});
  if(inputMode==="voice")setTimeout(()=>speakText(pickText(q.q)),150);
}
function chooseAnswer(el,value,isMulti){
  if(isMulti){let selected=Array.isArray(consultationAnswers[questionIndex])?[...consultationAnswers[questionIndex]]:[];const none=/none|कोई नहीं|কোনো না|ఏదీ కాదు|कोणी नाही|எதுவும் இல்லை|કંઈ નહીં|ಯಾವುದೂ ಇಲ್ಲ|ഒന്നുമില്ല|ਕੋਈ ਨਹੀਂ/i.test(value);if(none)selected=[];if(selected.includes(value))selected=selected.filter(x=>x!==value);else selected.push(value);consultationAnswers[questionIndex]=selected;qsa(".choice-btn").forEach(b=>{const v=b.textContent.trim();b.classList.toggle("selected",selected.includes(v))});}
  else {qsa(".choice-btn").forEach(b=>b.classList.remove("selected"));el.classList.add("selected");consultationAnswers[questionIndex]=value}
  if(qs("#voiceTranscript"))qs("#voiceTranscript").textContent=Array.isArray(consultationAnswers[questionIndex])?consultationAnswers[questionIndex].join(", "):consultationAnswers[questionIndex];
}
function nextQuestion(){
  if(!Array.isArray(activeQuestions)||activeQuestions.length===0){buildQuestionFlow(currentConcern||"");}
  const q=activeQuestions[questionIndex];
  if(!q)return;
  const input=qs("#answerInput");if(input)consultationAnswers[questionIndex]=input.value.trim();
  if(q.type!=="upload"&&!consultationAnswers[questionIndex]?.length){showToast((T[jarvisLanguage]||T.en).required);return}
  if(q.id==="concern"){currentConcern=typeof consultationAnswers[questionIndex]==="string"?consultationAnswers[questionIndex]:"";const oldLen=activeQuestions.length;const cats=buildQuestionFlow(currentConcern);if(activeQuestions.length!==oldLen)showToast((T[jarvisLanguage]||T.en).smart)}
  if(questionIndex<activeQuestions.length-1){questionIndex++;renderQuestion()}else saveConsultation();
}
function skipCurrentQuestion(){consultationAnswers[questionIndex]=[];nextQuestion()}
function prevQuestion(){if(questionIndex>0){questionIndex--;renderQuestion()}else goBackInApp()}
function saveConsultation(){
  const entry={id:"C-"+Date.now(),date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),language:jarvisLanguage,concern:currentConcern,answers:[...consultationAnswers]};
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");history.unshift(entry);localStorage.setItem("js_consultations",JSON.stringify(history));
  if(window.speechSynthesis)window.speechSynthesis.cancel();showToast((T[jarvisLanguage]||T.en).saved);renderHistory();renderRecent();showPatientPage("history");
}

function renderRecent(){
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");
  const rows=history.slice(0,3);
  qs("#recentConsultations").innerHTML=(rows.length?rows:[{date:"12 May 2026",answers:["Routine health check completed"]}]).map((h,i)=>`<div class="consult-item"><div class="consult-icon"><i class="bi bi-stars"></i></div><div><strong>JARVIS health check</strong><small>${h.date} • ${h.answers?.[0]||"Routine health check completed"}</small></div><span class="status-pill stable ms-auto"><i class="bi bi-check"></i>Saved</span></div>`).join("");
}
function renderHistory(){
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");
  qs("#historyList").innerHTML=(history.length?history:[{date:"12 May 2026",answers:["Routine health check completed","2–3 days","None of these","None","No"]}]).map(h=>`<div class="timeline-item"><div class="timeline-date"><strong>${h.date}</strong><small>JARVIS check</small></div><div class="timeline-line"><div class="timeline-dot"><i class="bi bi-stars"></i></div></div><div class="timeline-card"><strong>Health check-in completed</strong><p>${h.answers?.[0]||"Routine health check completed"}</p><span class="status-pill stable"><i class="bi bi-check-circle-fill"></i> Saved</span></div></div>`).join("");
}
function renderDocuments(){
  const stored=JSON.parse(localStorage.getItem("js_documents")||"[]");
  const all=[...stored,...documents];
  qs("#docCount").textContent=all.length;
  qs("#documentsList").innerHTML=all.map((d,i)=>`<div class="document-row"><div class="file-icon"><i class="bi ${d.type==="image"?"bi-file-earmark-image-fill":d.type==="doc"?"bi-file-earmark-word-fill":"bi-file-earmark-pdf-fill"}"></i></div><div><strong>${d.name}</strong><small>${d.size||"Local file"} • ${d.date||"Just now"}</small></div><span class="status-pill stable"><i class="bi bi-check"></i>Available</span><button class="icon-btn" onclick="showToast('Preview is frontend-only in this prototype.')"><i class="bi bi-eye"></i></button></div>`).join("");
}
function handleFiles(files){
  const existing=JSON.parse(localStorage.getItem("js_documents")||"[]");
  [...files].forEach(file=>existing.unshift({name:file.name,size:(file.size/1024/1024).toFixed(1)+" MB",date:"Just now",type:file.type.includes("image")?"image":file.name.endsWith(".doc")||file.name.endsWith(".docx")?"doc":"pdf"}));
  localStorage.setItem("js_documents",JSON.stringify(existing));renderDocuments();showToast(`${files.length} document(s) added to demo storage.`);
}

document.addEventListener("DOMContentLoaded",()=>{
  history.replaceState({screen:"login"},"",location.href);
  qsa(".role-btn").forEach(btn=>btn.addEventListener("click",()=>{qsa(".role-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active")}));
  qsa(".auth-method").forEach(btn=>btn.addEventListener("click",()=>{qsa(".auth-method").forEach(b=>b.classList.remove("active"));btn.classList.add("active");authMethod=btn.dataset.auth;const abha=authMethod==="abha";qs("#authLabel").textContent=abha?"ABHA Address":"Aadhaar number";qs("#authInputIcon").className=abha?"bi bi-heart-pulse":"bi bi-fingerprint";qs("#aadhaarInput").value="";qs("#aadhaarInput").maxLength=abha?64:12;qs("#aadhaarInput").inputMode=abha?"text":"numeric";qs("#aadhaarInput").placeholder=abha?"e.g. ravi@abha":"XXXX XXXX XXXX";qs("#authHint").textContent=abha?"Use a demo ABHA Address such as ravi@abha. No real ABHA data is processed.":"Enter any 12-digit demo Aadhaar number. No real Aadhaar data is processed.";qs("#authFormText").textContent=abha?"Your ABHA Address is not sent anywhere in this prototype.":"Your Aadhaar number is not sent anywhere in this prototype."}));
  const languageSelectors=[qs("#jarvisLanguage"),qs("#jarvisLanguageConsult")].filter(Boolean);
  languageSelectors.forEach(sel=>{Object.entries(LANGUAGES).forEach(([key,v])=>{if(!sel.querySelector(`option[value="${key}"]`)){const o=document.createElement("option");o.value=key;o.textContent=v.name;sel.appendChild(o)}});sel.value=jarvisLanguage;sel.addEventListener("change",e=>{jarvisLanguage=e.target.value;languageSelectors.forEach(x=>x.value=jarvisLanguage);updateJarvisLanguage();if(qs("#consultationPage").classList.contains("active-page"))renderQuestion()})});
  qsa(".mode-btn").forEach(btn=>btn.addEventListener("click",()=>setInputMode(btn.dataset.mode)));
  qs("#loginBtn").onclick=login;qs("#passwordLoginBtn").onclick=completePasswordLogin;qs("#passwordBackBtn").onclick=resetAuthStep;qs("#togglePassword").onclick=()=>{const i=qs("#passwordInput");i.type=i.type==="password"?"text":"password"};qs("#passwordInput").addEventListener("keydown",e=>{if(e.key==="Enter")completePasswordLogin()});qs("#aadhaarInput").addEventListener("keydown",e=>{if(e.key==="Enter")login()});qs("#signupBtn").onclick=openRegistration;qs("#registrationClose").onclick=closeRegistration;qs("#registrationForm").addEventListener("submit",registerUser);qs("#regAuthMethod").addEventListener("change",e=>{qs("#regIdentity").placeholder=e.target.value==="abha"?"e.g. ravi@abha":"12-digit demo Aadhaar"});
  qs("#logoutBtn").onclick=()=>{qs("#appView").classList.add("d-none");qs("#loginView").classList.remove("d-none");qs("#aadhaarInput").value="";resetAuthStep();navigationStack=[];history.replaceState({screen:"login"},"",location.href)};
  qs("#mobileMenuBtn").onclick=()=>qs(".sidebar").classList.toggle("open");
  qs("#patientSearch").addEventListener("input",e=>{const term=e.target.value.toLowerCase();renderPatients(patients.filter(p=>`${p.name} ${p.id}`.toLowerCase().includes(term)))});
  qs("#allPatientSearch").addEventListener("input",e=>{const term=e.target.value.toLowerCase();qs("#allPatientBody").innerHTML=patients.filter(p=>`${p.name} ${p.id}`.toLowerCase().includes(term)).map((p,i)=>patientRow(p,i)).join("")});
  qsa("[data-detail-tab]").forEach(tab=>tab.onclick=()=>{qsa("[data-detail-tab]").forEach(t=>t.classList.remove("active"));tab.classList.add("active");renderDetail(tab.dataset.detailTab)});
  qs("#fileInput").addEventListener("change",e=>{if(e.target.files.length)handleFiles(e.target.files);e.target.value=""});
  const wellnessInfo={overview:["JeevanSetu Health","Your primary health record, JARVIS check-ins and doctor-ready history."] ,ayurveda:["Ayurveda","General information about Ayurveda and wellness practices. Use a qualified practitioner for personalized care."],ayush:["AYUSH","Explore India's traditional and complementary healthcare systems in one place."],homeopathy:["Homeopathy","Educational information only. Consult a qualified practitioner before using any treatment."],unani:["Unani","General wellness information from the Unani system. Do not replace prescribed medical care."],siddha:["Siddha","General information about Siddha wellness practices and traditional care."],yoga:["Yoga & Naturopathy","Explore movement, breathing, relaxation and lifestyle practices for general wellness."],sowa:["Sowa-Rigpa","General information about the Himalayan traditional medical system."]};
  qsa(".wellness-nav-item").forEach(btn=>btn.onclick=()=>{qsa(".wellness-nav-item").forEach(b=>b.classList.remove("active"));btn.classList.add("active");const info=wellnessInfo[btn.dataset.wellness]||wellnessInfo.overview;qs("#wellnessTitle").textContent=info[0];qs("#wellnessText").textContent=info[1];qs("#wellnessPanel").classList.remove("d-none");});
  const zone=qs("#uploadZone");["dragenter","dragover"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.style.borderColor="#1261d6"}));["dragleave","drop"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.style.borderColor="#cdd9e9"}));zone.addEventListener("drop",e=>{if(e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)});
  window.addEventListener("popstate",()=>{if(qs("#loginView").classList.contains("d-none")&&navigationStack.length>1){navigationStack.pop();const prev=navigationStack[navigationStack.length-1];suppressNavigation=true;if(prev.role==="doctor")showDoctorPage(prev.page,true);else showPatientPage(prev.page,true);suppressNavigation=false}else if(!qs("#loginView").classList.contains("d-none")){history.pushState({screen:"login"},"",location.href);showToast("Use the website tabs to navigate.")}});
});
function updateJarvisLanguage(){
  const hi=jarvisLanguage!=="en";const hero={en:"How are you feeling today?",hi:"आज आप कैसा महसूस कर रहे हैं?",bn:"আজ আপনি কেমন অনুভব করছেন?",te:"ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?",mr:"आज तुम्हाला कसे वाटत आहे?",ta:"இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",gu:"આજે તમને કેવું લાગે છે?",kn:"ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?",ml:"ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?",pa:"ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?"};
  const intro={en:"Let’s understand your health.",hi:"आइए आपके स्वास्थ्य को समझते हैं।",bn:"চলুন আপনার স্বাস্থ্য বুঝি।",te:"మీ ఆరోగ్యాన్ని అర్థం చేసుకుందాం.",mr:"चला तुमचे आरोग्य समजून घेऊया.",ta:"உங்கள் உடல்நிலையைப் புரிந்துகொள்வோம்.",gu:"ચાલો તમારા સ્વાસ્થ્યને સમજીએ.",kn:"ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ.",ml:"നിങ്ങളുടെ ആരോഗ്യത്തെ മനസ്സിലാക്കാം.",pa:"ਆਓ ਤੁਹਾਡੀ ਸਿਹਤ ਨੂੰ ਸਮਝੀਏ."};
  const desc={en:"I’ll ask about your current issue and important health history, then organize your answers for your healthcare provider.",hi:"मैं आपकी वर्तमान समस्या और महत्वपूर्ण स्वास्थ्य इतिहास के बारे में पूछूंगा और आपकी जानकारी डॉक्टर के लिए व्यवस्थित करूंगा।",bn:"আমি আপনার বর্তমান সমস্যা ও গুরুত্বপূর্ণ স্বাস্থ্য ইতিহাস সম্পর্কে জিজ্ঞেস করব এবং তথ্য ডাক্তারকে দেখানোর জন্য সাজিয়ে দেব।",te:"మీ ప్రస్తుత సమస్య మరియు ముఖ్యమైన ఆరోగ్య చరిత్ర గురించి అడిగి, మీ సమాధానాలను వైద్యుడి కోసం క్రమబద్ధీకరిస్తాను.",mr:"मी तुमची सध्याची समस्या आणि महत्त्वाचा आरोग्य इतिहास विचारून माहिती डॉक्टरसाठी व्यवस्थित करेन.",ta:"உங்கள் தற்போதைய பிரச்சினை மற்றும் முக்கியமான உடல்நல வரலாறு பற்றி கேட்டு, தகவலை மருத்துவருக்காக ஒழுங்குபடுத்துவேன்.",gu:"હું તમારી હાલની સમસ્યા અને મહત્વપૂર્ણ આરોગ્ય ઇતિહાસ વિશે પૂછીને માહિતી ડૉક્ટર માટે ગોઠવીશ.",kn:"ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸಮಸ್ಯೆ ಮತ್ತು ಪ್ರಮುಖ ಆರೋಗ್ಯ ಇತಿಹಾಸವನ್ನು ಕೇಳಿ, ಮಾಹಿತಿಯನ್ನು ವೈದ್ಯರಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ.",ml:"നിലവിലെ പ്രശ്നവും പ്രധാന ആരോഗ്യചരിത്രവും ചോദിച്ച് വിവരങ്ങൾ ഡോക്ടർക്കായി ക്രമീകരിക്കും.",pa:"ਮੈਂ ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਸਮੱਸਿਆ ਅਤੇ ਮਹੱਤਵਪੂਰਨ ਸਿਹਤ ਇਤਿਹਾਸ ਬਾਰੇ ਪੁੱਛ ਕੇ ਜਾਣਕਾਰੀ ਡਾਕਟਰ ਲਈ ਤਿਆਰ ਕਰਾਂਗਾ."};
  if(qs("#jarvisHeroTitle"))qs("#jarvisHeroTitle").textContent=hero[jarvisLanguage]||hero.en;if(qs("#jarvisIntroTitle"))qs("#jarvisIntroTitle").textContent=intro[jarvisLanguage]||intro.en;if(qs("#jarvisIntroText"))qs("#jarvisIntroText").textContent=desc[jarvisLanguage]||desc.en;
}
window.speechSynthesis?.addEventListener?.("voiceschanged",()=>{});

/* ===================== JEEVANSETU JARVIS v4 =====================
   Robust, Indian-context adaptive interview + voice controls.
   Frontend demo only: never presents itself as a diagnosis engine.
================================================================== */
Object.assign(LANGUAGES, {
  as:{name:"অসমীয়া",speech:"as-IN"},
  or:{name:"ଓଡ଼ିଆ",speech:"or-IN"},
  ur:{name:"اردو",speech:"ur-IN"},
  hinglish:{name:"Hinglish",speech:"en-IN"}
});
Object.assign(T, {
  as:{question:"প্ৰশ্ন",of:"ৰ ভিতৰত",back:"পিছলৈ",next:"আগলৈ",review:"পৰীক্ষা কৰি সংৰক্ষণ কৰক",selectAll:"যিবোৰ প্ৰযোজ্য সকলো বাছনি কৰক।",required:"আগলৈ যোৱাৰ আগতে উত্তৰ দিয়ক।",voiceReady:"ভইচ মোড সাজু",listening:"শুনি আছোঁ… এতিয়া কওক",speaking:"JARVIS কথা কৈ আছে…",noVoice:"এই ব্ৰাউজাৰত ভইচ চিনাক্তকৰণ নাই। টেক্সট ব্যৱহাৰ কৰক।",listen:"উত্তৰ দিবলৈ মাইক্ৰ'ফোন টিপক",stop:"শুনা বন্ধ কৰক",speakAgain:"প্ৰশ্নটো আকৌ শুনক",save:"সংৰক্ষণ কৰক",saved:"স্বাস্থ্য তথ্য সংৰক্ষণ কৰা হৈছে।",optional:"ঐচ্ছিক চিকিৎসা নথি",optionalHelp:"ৰিপ'ৰ্ট, প্ৰেছক্ৰিপচন বা স্কেন যোগ কৰক, অথবা এৰি দিয়ক।",choose:"ফাইল বাছনি কৰক",skip:"এৰি দিয়ক — নথি ঐচ্ছিক",smart:"আপোনাৰ বৰ্তমান সমস্যাৰ ওপৰত ভিত্তি কৰি JARVIS-এ অতিৰিক্ত প্ৰশ্ন যোগ কৰিছে।",urgent:"গুৰুতৰ শ্বাসকষ্ট, বুকুৰ বিষ, অজ্ঞান হোৱা বা খুব বেছি অসুস্থ লাগিলে প্ৰশ্নাৱলীৰ ওপৰত নিৰ্ভৰ নকৰি তৎক্ষণাত চিকিৎসা সহায় লওক।"},
  or:{question:"ପ୍ରଶ୍ନ",of:"ମଧ୍ୟରୁ",back:"ପଛକୁ",next:"ଆଗକୁ",review:"ଯାଞ୍ଚ କରି ସେଭ୍ କରନ୍ତୁ",selectAll:"ପ୍ରଯୁଜ୍ୟ ସମସ୍ତ ବିକଳ୍ପ ବାଛନ୍ତୁ।",required:"ଆଗକୁ ବଢ଼ିବା ପୂର୍ବରୁ ଉତ୍ତର ଦିଅନ୍ତୁ।",voiceReady:"ଭଏସ୍ ମୋଡ୍ ପ୍ରସ୍ତୁତ",listening:"ଶୁଣୁଛି… ଏବେ କୁହନ୍ତୁ",speaking:"JARVIS କହୁଛି…",noVoice:"ଏହି ବ୍ରାଉଜରରେ ଭଏସ୍ ଚିହ୍ନଟ ଉପଲବ୍ଧ ନାହିଁ। ଟେକ୍ସଟ୍ ବ୍ୟବହାର କରନ୍ତୁ।",listen:"ଉତ୍ତର ଦେବାକୁ ମାଇକ୍ ଦବାନ୍ତୁ",stop:"ଶୁଣିବା ବନ୍ଦ କରନ୍ତୁ",speakAgain:"ପ୍ରଶ୍ନ ପୁଣି ଶୁଣନ୍ତୁ",save:"ସେଭ୍ କରନ୍ତୁ",saved:"ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ ସେଭ୍ ହୋଇଛି।",optional:"ଇଚ୍ଛାଧୀନ ଚିକିତ୍ସା ଡକ୍ୟୁମେଣ୍ଟ",optionalHelp:"ରିପୋର୍ଟ, ପ୍ରେସକ୍ରିପସନ୍ କିମ୍ବା ସ୍କାନ୍ ଯୋଡନ୍ତୁ, କିମ୍ବା ଛାଡନ୍ତୁ।",choose:"ଫାଇଲ୍ ବାଛନ୍ତୁ",skip:"ଛାଡନ୍ତୁ — ଡକ୍ୟୁମେଣ୍ଟ ଇଚ୍ଛାଧୀନ",smart:"ଆପଣଙ୍କ ବର୍ତ୍ତମାନ ସମସ୍ୟା ଆଧାରରେ JARVIS କିଛି ଅତିରିକ୍ତ ପ୍ରଶ୍ନ ଯୋଡିଛି।",urgent:"ଗୁରୁତର ଶ୍ୱାସକଷ୍ଟ, ଛାତି ଯନ୍ତ୍ରଣା, ବେହୋସ୍ କିମ୍ବା ଅତ୍ୟଧିକ ଅସୁସ୍ଥ ଲାଗିଲେ ତୁରନ୍ତ ଚିକିତ୍ସା ସହାୟତା ନିଅନ୍ତୁ।"},
  ur:{question:"سوال",of:"میں سے",back:"پیچھے",next:"آگے",review:"جائزہ لے کر محفوظ کریں",selectAll:"تمام متعلقہ اختیارات منتخب کریں۔",required:"آگے بڑھنے سے پہلے جواب دیں۔",voiceReady:"وائس موڈ تیار ہے",listening:"سن رہا ہوں… اب بولیں",speaking:"JARVIS بول رہا ہے…",noVoice:"اس براؤزر میں وائس ریکگنیشن دستیاب نہیں۔ متن استعمال کریں۔",listen:"جواب دینے کے لیے مائیک دبائیں",stop:"سننا بند کریں",speakAgain:"سوال دوبارہ سنیں",save:"محفوظ کریں",saved:"صحت کی معلومات محفوظ ہو گئی ہیں۔",optional:"اختیاری طبی دستاویز",optionalHelp:"رپورٹ، نسخہ یا اسکین شامل کریں، یا چھوڑ دیں۔",choose:"فائل منتخب کریں",skip:"چھوڑ دیں — دستاویز اختیاری ہے",smart:"آپ کی موجودہ شکایت کی بنیاد پر JARVIS نے کچھ اضافی سوالات شامل کیے ہیں۔",urgent:"شدید سانس کی تکلیف، سینے میں شدید درد، بے ہوشی یا بہت زیادہ خرابی کی صورت میں فوراً طبی مدد حاصل کریں۔"},
  hinglish:{...T.en,question:"Question",back:"Back",next:"Next",review:"Review & save",selectAll:"Jo options apply, sab select karein.",required:"Aage badhne se pehle answer karein.",voiceReady:"Voice mode ready",listening:"Sun raha hoon… ab boliye",speaking:"JARVIS bol raha hai…",noVoice:"Is browser mein voice recognition available nahi hai. Aap text use kar sakte hain.",listen:"Answer dene ke liye mic dabaiye",speakAgain:"Question dobara suniye",save:"Save",saved:"Health information save ho gayi.",optional:"Optional medical document",optionalHelp:"Report, prescription ya scan add karein, ya skip karein.",choose:"Files choose karein",skip:"Skip — document optional hai",smart:"Aapki current problem ke basis par JARVIS ne kuch extra questions add kiye hain.",urgent:"Agar bahut zyada saans ki dikkat, severe chest pain, behoshi ya bahut serious tabiyat ho, to turant medical help lein."}
});

function pickText(obj){
  if(typeof obj === "string") return obj;
  if(!obj) return "";
  return obj[jarvisLanguage] || obj.hi || obj.en || Object.values(obj)[0] || "";
}
function pickOptions(obj){
  if(!obj) return [];
  return obj[jarvisLanguage] || obj.hi || obj.en || Object.values(obj)[0] || [];
}

// Extra Indian-context branches. These are intake questions, not diagnosis rules.
adaptive.kidney = [
  {id:"kidney_urine",q:{en:"Any change in urine quantity, blood in urine, burning, swelling of feet, or pain near the side/back?",hi:"क्या पेशाब की मात्रा में बदलाव, पेशाब में खून, जलन, पैरों में सूजन या कमर/बगल में दर्द है?"},type:"multi",options:{en:["Less urine","More urine","Blood in urine","Burning","Foot swelling","Side/back pain","None"],hi:["कम पेशाब","ज्यादा पेशाब","पेशाब में खून","जलन","पैरों में सूजन","कमर/बगल में दर्द","कोई नहीं"]}},
  {id:"kidney_history",q:{en:"Have you ever had kidney stones, kidney disease, repeated urine infections, or dialysis?",hi:"क्या कभी किडनी स्टोन, किडनी रोग, बार-बार पेशाब का संक्रमण या डायलिसिस हुआ है?"},type:"text",placeholder:{en:"Mention what happened and when, or None",hi:"क्या हुआ और कब हुआ बताएं, या 'कोई नहीं' लिखें"}}
];
adaptive.liver = [
  {id:"liver_symptoms",q:{en:"Have you noticed yellow eyes/skin, dark urine, pale stool, abdominal swelling, or unusual itching?",hi:"क्या आंख/त्वचा पीली, पेशाब गहरा, मल हल्का, पेट में सूजन या असामान्य खुजली हुई है?"},type:"multi",options:{en:["Yellow eyes/skin","Dark urine","Pale stool","Abdominal swelling","Itching","None"],hi:["आंख/त्वचा पीली","गहरा पेशाब","हल्का मल","पेट में सूजन","खुजली","कोई नहीं"]}},
  {id:"liver_risk",q:{en:"Have you ever been told you have hepatitis, fatty liver, or another liver problem?",hi:"क्या कभी हेपेटाइटिस, फैटी लिवर या किसी अन्य लिवर की समस्या के बारे में बताया गया है?"},type:"text",placeholder:{en:"Condition and approximate year, or None",hi:"बीमारी और लगभग वर्ष, या 'कोई नहीं'"}}
];
adaptive.urinary = [
  {id:"urinary_symptoms",q:{en:"Do you have burning while urinating, frequent urination, urgency, lower abdominal pain, or blood in urine?",hi:"क्या पेशाब में जलन, बार-बार पेशाब, तुरंत पेशाब लगना, पेट के निचले हिस्से में दर्द या पेशाब में खून है?"},type:"multi",options:{en:["Burning","Frequent urine","Urgency","Lower abdominal pain","Blood in urine","None"],hi:["जलन","बार-बार पेशाब","तुरंत पेशाब लगना","निचले पेट में दर्द","पेशाब में खून","कोई नहीं"]}}
];
adaptive.women = [
  {id:"women_cycle",q:{en:"If relevant to you, are there changes in periods such as very heavy bleeding, missed periods, unusual pain, or unusual discharge?",hi:"यदि लागू हो, तो क्या पीरियड में बहुत ज्यादा ब्लीडिंग, पीरियड रुकना, असामान्य दर्द या असामान्य डिस्चार्ज है?"},type:"multi",options:{en:["Heavy bleeding","Missed/irregular periods","Unusual pain","Unusual discharge","Not applicable","None"],hi:["बहुत ज्यादा ब्लीडिंग","पीरियड अनियमित/रुका","असामान्य दर्द","असामान्य डिस्चार्ज","लागू नहीं","कोई नहीं"]}},
  {id:"pregnancy",q:{en:"If there is any chance of pregnancy, could you currently be pregnant?",hi:"अगर गर्भधारण की संभावना है, तो क्या इस समय गर्भावस्था हो सकती है?"},type:"choice",options:{en:["Yes","No","Not sure","Not applicable"],hi:["हाँ","नहीं","पता नहीं","लागू नहीं"]}}
];
adaptive.skin = [
  {id:"skin_pattern",q:{en:"What does the skin problem look or feel like: rash, itching, swelling, wound, blister, or colour change?",hi:"त्वचा की समस्या कैसी है: दाने, खुजली, सूजन, घाव, छाले या रंग में बदलाव?"},type:"multi",options:{en:["Rash","Itching","Swelling","Wound","Blister","Colour change","None"],hi:["दाने","खुजली","सूजन","घाव","छाले","रंग में बदलाव","कोई नहीं"]}},
  {id:"skin_exposure",q:{en:"Did it start after a new medicine, food, cosmetic, soap, plant, insect bite, or other exposure?",hi:"क्या यह नई दवा, भोजन, कॉस्मेटिक, साबुन, पौधे, कीड़े के काटने या किसी अन्य संपर्क के बाद शुरू हुआ?"},type:"text",placeholder:{en:"Describe the possible trigger, or Not sure",hi:"संभावित कारण बताएं, या 'पता नहीं'"}}
];
adaptive.mental = [
  {id:"mental_mood",q:{en:"Over the last two weeks, have you often felt very low, worried, panicky, or unable to enjoy usual activities?",hi:"पिछले दो हफ्तों में क्या आप अक्सर बहुत उदास, चिंतित, घबराए हुए या सामान्य कामों में रुचि कम महसूस कर रहे हैं?"},type:"choice",options:{en:["Often","Sometimes","No","Prefer not to say"],hi:["अक्सर","कभी-कभी","नहीं","बताना नहीं चाहते"]}},
  {id:"mental_sleep",q:{en:"Has your sleep or daily functioning been significantly affected?",hi:"क्या आपकी नींद या रोजमर्रा के काम पर काफी असर पड़ा है?"},type:"choice",options:{en:["Yes","A little","No","Not sure"],hi:["हाँ","थोड़ा","नहीं","पता नहीं"]}}
];

const oldDetectCategories = detectCategories;
detectCategories = function(text){
  const base=oldDetectCategories(text);
  const s=(text||"").toLowerCase();
  const add=(regex,cat)=>{if(regex.test(s))base.push(cat)};
  add(/kidney|renal|stone|urine|पेशाब|किडनी|पथरी/,"kidney");
  add(/liver|hepatitis|jaundice|fatty liver|लिवर|पीलिया|हेपेटाइटिस/,"liver");
  add(/urine|urinary|uti|burning urine|पेशाब|मूत्र/,"urinary");
  add(/period|menstrual|pregnan|pcos|pregnancy|पीरियड|मासिक|गर्भ|पीसीओएस/,"women");
  add(/rash|itch|skin|allergy|दाने|खुजली|त्वचा|एलर्जी/,"skin");
  add(/anxiety|stress|depress|panic|sleep|sad|चिंता|तनाव|डिप्रेशन|नींद|उदास/,"mental");
  return [...new Set(base)];
};

function normalizeSpeech(s){
  return (s||"").toLowerCase().replace(/[.,!?;:()]/g," ").replace(/\s+/g," ").trim();
}
function spokenMatches(text, option){
  const t=normalizeSpeech(text), o=normalizeSpeech(option);
  if(!t||!o)return false;
  if(t===o || t.includes(o) || o.includes(t))return true;
  const aliases={
    yes:["yes","yeah","haan","ha","हां","हाँ","জি","అవును","हो","होय","ஆம்","હા","ಹೌದು","അതെ","ਹਾਂ"],
    no:["no","nah","nahi","नहीं","না","లేదు","नाही","இல்லை","ના","ಇಲ್ಲ","ഇല്ല","ਨਹੀਂ"],
    none:["none","nothing","kuch nahi","कुछ नहीं","কিছু নেই","ఏమీ లేదు","काही नाही","எதுவும் இல்லை","કંઈ નહીં","ಏನೂ ಇಲ್ಲ","ഒന്നുമില്ല","ਕੁਝ ਨਹੀਂ"]
  };
  for(const key of Object.keys(aliases)) if(aliases[key].some(a=>t===a || t.includes(a)) && aliases[key].some(a=>o.includes(a))) return true;
  const words=o.split(" ").filter(w=>w.length>2);
  return words.length>0 && words.filter(w=>t.includes(w)).length>=Math.max(1,Math.ceil(words.length*.5));
}
function applyVoiceAnswer(text){
  const q=activeQuestions[questionIndex]; if(!q)return;
  consultationAnswers[questionIndex]=text.trim();
  if(q.type!=="choice" && q.type!=="multi"){
    const input=qs("#answerInput");if(input)input.value=text.trim();
    return;
  }
  const opts=pickOptions(q.options);
  const matched=opts.filter(o=>spokenMatches(text,o));
  if(q.type==="choice" && matched.length){
    consultationAnswers[questionIndex]=matched[0];
    qsa(".choice-btn").forEach(b=>b.classList.toggle("selected",b.textContent.trim()===matched[0]));
  } else if(q.type==="multi" && matched.length){
    consultationAnswers[questionIndex]=matched;
    qsa(".choice-btn").forEach(b=>b.classList.toggle("selected",matched.includes(b.textContent.trim())));
  }
  const out=qs("#voiceTranscript");if(out)out.textContent=Array.isArray(consultationAnswers[questionIndex])?consultationAnswers[questionIndex].join(", "):consultationAnswers[questionIndex];
}

function setVoiceStatus(type,text){
  const el=qs("#voiceStatus");if(!el)return;
  const icon=type==="listening"?"bi-mic-fill":type==="speaking"?"bi-volume-up-fill":type==="error"?"bi-exclamation-triangle-fill":"bi-check-circle";
  el.className="voice-status "+(type||"");el.innerHTML=`<i class="bi ${icon}"></i><span>${text}</span>`;
}
function findBestVoice(lang){
  const voices=window.speechSynthesis?.getVoices?.()||[];
  const wanted=(lang||"en-IN").toLowerCase();
  return voices.find(v=>v.lang.toLowerCase()===wanted)
      || voices.find(v=>v.lang.toLowerCase().startsWith(wanted.split("-")[0]))
      || voices.find(v=>v.lang.toLowerCase().startsWith("en-in"))
      || voices[0];
}
function speakText(text){
  if(!text)return;
  if(!window.speechSynthesis){setVoiceStatus("error",(T[jarvisLanguage]||T.en).noVoice);return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=LANGUAGES[jarvisLanguage]?.speech||"en-IN";u.rate=.88;u.pitch=1;
  const voice=findBestVoice(u.lang);if(voice)u.voice=voice;
  u.onstart=()=>setVoiceStatus("speaking",(T[jarvisLanguage]||T.en).speaking);
  u.onend=()=>{
    setVoiceStatus("",(T[jarvisLanguage]||T.en).voiceReady);
    if(inputMode==="voice" && qs("#handsFreeToggle")?.checked && !qs("#voiceMic")?.classList.contains("listening")) setTimeout(toggleListening,250);
  };
  u.onerror=()=>setVoiceStatus("error","Voice playback failed. You can continue with text.");
  window.speechSynthesis.speak(u);
}
function initRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){setVoiceStatus("error",(T[jarvisLanguage]||T.en).noVoice);return null;}
  const r=new SR();r.lang=LANGUAGES[jarvisLanguage]?.speech||"en-IN";r.interimResults=true;r.continuous=false;r.maxAlternatives=3;
  r.onstart=()=>{setVoiceStatus("listening",(T[jarvisLanguage]||T.en).listening);qs("#voiceMic")?.classList.add("listening");};
  r.onresult=e=>{
    let text="";for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;
    const out=qs("#voiceTranscript");if(out)out.textContent=text;
    if(e.results[e.results.length-1].isFinal){applyVoiceAnswer(text);showToast("Voice answer captured. Tap Next when ready.");}
  };
  r.onerror=e=>{qs("#voiceMic")?.classList.remove("listening");setVoiceStatus("error",e.error==="not-allowed"?"Microphone permission denied. Allow microphone access in the browser.":e.error==="no-speech"?"I did not hear anything. Tap the microphone and try again.":"Voice input paused. You can retry or use text.");};
  r.onend=()=>{qs("#voiceMic")?.classList.remove("listening");if(!qs("#voiceStatus")?.classList.contains("error"))setVoiceStatus("",(T[jarvisLanguage]||T.en).voiceReady);};
  return r;
}
function toggleListening(){
  if(!recognition)recognition=initRecognition();if(!recognition)return;
  const btn=qs("#voiceMic");
  if(btn?.classList.contains("listening")){try{recognition.stop();}catch(e){}return;}
  recognition.lang=LANGUAGES[jarvisLanguage]?.speech||"en-IN";
  try{recognition.start();}catch(e){setVoiceStatus("error","Microphone is already starting. Please wait a moment and try again.");}
}
function setInputMode(mode){
  inputMode=mode;
  qsa(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  renderQuestion();
}

function renderQuestion(){
  if(!Array.isArray(activeQuestions)||activeQuestions.length===0){buildQuestionFlow(currentConcern||"");}
  if(questionIndex<0)questionIndex=0;
  if(questionIndex>=activeQuestions.length)questionIndex=activeQuestions.length-1;
  const q=activeQuestions[questionIndex],total=activeQuestions.length,pct=Math.round(((questionIndex+1)/total)*100),lang=T[jarvisLanguage]||T.en;
  qs("#questionCounter").textContent=`${lang.question} ${questionIndex+1} ${lang.of} ${total}`;qs("#progressPercent").textContent=pct+"%";qs("#questionProgress").style.width=pct+"%";
  const categories=detectCategories(currentConcern);const smartNote=questionIndex===4&&categories.length?`<div class="adaptive-note"><i class="bi bi-stars me-1"></i>${lang.smart}</div>`:"";
  let html=smartNote+`<div class="question-title">${pickText(q.q)}</div>${q.help?`<div class="question-help">${pickText(q.help)}</div>`:""}`;
  const saved=consultationAnswers[questionIndex];
  if(q.type==="text"){
    html+=`<textarea id="answerInput" rows="4" placeholder="${pickText(q.placeholder||{en:"Type your answer"})}">${typeof saved==="string"?saved:""}</textarea>`;
    if(inputMode==="voice")html+=`<div class="voice-answer mt-3"><p>${lang.listen}</p><div class="voice-actions"><button id="voiceMic" class="voice-btn" onclick="toggleListening()" title="Microphone"><i class="bi bi-mic-fill"></i></button><button class="speak-again" onclick="speakText(pickText(activeQuestions[questionIndex].q))"><i class="bi bi-volume-up me-1"></i>${lang.speakAgain}</button></div><div id="voiceTranscript" class="transcript">${typeof saved==="string"?saved:""}</div></div>`;
  } else if(q.type==="choice"||q.type==="multi"){
    const selected=Array.isArray(saved)?saved:(saved?[saved]:[]);const opts=pickOptions(q.options);
    html+=`<div class="${q.type==="multi"?"choice-grid multi-choice-grid":"choice-grid"}">${opts.map(o=>`<button class="choice-btn ${selected.includes(o)?"selected":""}" onclick="chooseAnswer(this,${JSON.stringify(o)},${q.type==="multi"})">${o}</button>`).join("")}</div>${q.type==="multi"?`<div class="question-help mt-3">${lang.selectAll}</div>`:""}`;
    if(inputMode==="voice")html+=`<div class="voice-answer mt-3"><p>${lang.listen}</p><div class="voice-actions"><button id="voiceMic" class="voice-btn" onclick="toggleListening()"><i class="bi bi-mic-fill"></i></button><button class="speak-again" onclick="speakText(pickText(activeQuestions[questionIndex].q))"><i class="bi bi-volume-up me-1"></i>${lang.speakAgain}</button></div><div id="voiceTranscript" class="transcript">${Array.isArray(saved)?saved.join(", "):saved||""}</div></div>`;
  } else if(q.type==="upload"){
    html+=`<div class="optional-upload-box"><div class="upload-icon"><i class="bi bi-cloud-arrow-up-fill"></i></div><div><strong>${lang.optional}</strong><p>${lang.optionalHelp}</p></div><input id="jarvisFileInput" type="file" hidden multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"><button class="btn btn-outline-primary btn-sm" onclick="qs('#jarvisFileInput').click()">${lang.choose}</button><div id="jarvisFileNames" class="file-names">${saved?.length?saved.join(", "):""}</div></div><button class="skip-upload" onclick="skipCurrentQuestion()">${lang.skip}</button>`;
  }
  if(isEmergencyConcern(currentConcern,consultationAnswers))html+=`<div class="urgent-banner"><i class="bi bi-exclamation-triangle-fill me-1"></i>${lang.urgent}</div>`;
  html+=`<div class="question-actions"><button class="btn btn-light" ${questionIndex===0?"disabled":""} onclick="prevQuestion()">${lang.back}</button><button class="btn btn-primary" onclick="nextQuestion()">${questionIndex===total-1?lang.review:lang.next} <i class="bi bi-arrow-right ms-1"></i></button></div>`;
  qs("#questionArea").innerHTML=html;
  if(qs("#jarvisFileInput"))qs("#jarvisFileInput").addEventListener("change",e=>{consultationAnswers[questionIndex]=[...e.target.files].map(f=>f.name);qs("#jarvisFileNames").textContent=consultationAnswers[questionIndex].join(", ")});
  if(inputMode==="voice")setTimeout(()=>speakText(pickText(q.q)),150);
}
function isEmergencyConcern(concern,answers){
  const s=normalizeSpeech(concern);const text=normalizeSpeech((answers||[]).flatMap(x=>Array.isArray(x)?x:[x]).join(" "));
  return /(severe chest pain|chest pain.*arm|cannot breathe|can't breathe|very severe|fainting|unconscious|blue lips|heavy bleeding|stroke|paralysis|खून बहुत|बेहोश|सांस.*नहीं|सीने.*तेज|होंठ.*नीले|बहुत ज्यादा रक्तस्राव)/i.test(s+" "+text);
}

// Voice answers are also mapped into the current choice UI, making spoken Yes/No and option answers actually usable.
function chooseAnswer(el,value,isMulti){
  if(isMulti){
    let selected=Array.isArray(consultationAnswers[questionIndex])?[...consultationAnswers[questionIndex]]:[];
    const none=/none|कोई नहीं|কোনো না|ఏదీ కాదు|कोणी नाही|எதுவும் இல்லை|કંઈ નહીં|ಯಾವುದೂ ಇಲ್ಲ|ഒന്നുമില്ല|ਕੋਈ ਨਹੀਂ|କିଛି ନାହିଁ|কিছু নেই/i.test(value);
    if(none)selected=[];
    if(selected.includes(value))selected=selected.filter(x=>x!==value);else selected.push(value);
    consultationAnswers[questionIndex]=selected;
    qsa(".choice-btn").forEach(b=>{const v=b.textContent.trim();b.classList.toggle("selected",selected.includes(v));});
  }else{qsa(".choice-btn").forEach(b=>b.classList.remove("selected"));el.classList.add("selected");consultationAnswers[questionIndex]=value;}
  if(qs("#voiceTranscript"))qs("#voiceTranscript").textContent=Array.isArray(consultationAnswers[questionIndex])?consultationAnswers[questionIndex].join(", "):consultationAnswers[questionIndex];
}
function nextQuestion(){
  if(!Array.isArray(activeQuestions)||activeQuestions.length===0){buildQuestionFlow(currentConcern||"");}
  const q=activeQuestions[questionIndex];
  if(!q)return;
  const input=qs("#answerInput");if(input)consultationAnswers[questionIndex]=input.value.trim();
  if(q.type!=="upload"&&!consultationAnswers[questionIndex]?.length){showToast((T[jarvisLanguage]||T.en).required);return;}
  if(q.id==="concern"){
    currentConcern=typeof consultationAnswers[questionIndex]==="string"?consultationAnswers[questionIndex]:"";
    const oldIds=activeQuestions.map(x=>x.id).join("|");buildQuestionFlow(currentConcern);const newIds=activeQuestions.map(x=>x.id).join("|");
    if(newIds!==oldIds)showToast((T[jarvisLanguage]||T.en).smart);
  }
  if(q.type==="upload"){saveConsultation();return;}
  if(questionIndex<activeQuestions.length-1){questionIndex++;renderQuestion();}else saveConsultation();
}
function saveConsultation(){
  const entry={id:"C-"+Date.now(),date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),language:jarvisLanguage,concern:currentConcern,answers:[...consultationAnswers],adaptiveCategories:detectCategories(currentConcern),disclaimer:"Frontend prototype — not a medical diagnosis."};
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");history.unshift(entry);localStorage.setItem("js_consultations",JSON.stringify(history));
  if(window.speechSynthesis)window.speechSynthesis.cancel();if(recognition){try{recognition.stop();}catch(e){}}showToast((T[jarvisLanguage]||T.en).saved);renderHistory();renderRecent();showPatientPage("history");
}

// Make language switching update the JARVIS intro as well as the questionnaire.
function updateJarvisLanguage(){
  const hero={en:"How are you feeling today?",hi:"आज आप कैसा महसूस कर रहे हैं?",bn:"আজ আপনি কেমন অনুভব করছেন?",te:"ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?",mr:"आज तुम्हाला कसे वाटत आहे?",ta:"இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",gu:"આજે તમને કેવું લાગે છે?",kn:"ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?",ml:"ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?",pa:"ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",or:"ଆଜି ଆପଣ କେମିତି ଅନୁଭବ କରୁଛନ୍ତି?",as:"আজি আপুনি কেনে অনুভৱ কৰিছে?",ur:"آج آپ کیسا محسوس کر رہے ہیں؟",hinglish:"Aaj aap kaisa feel kar rahe hain?"};
  const intro={en:"Let’s understand your health.",hi:"आइए आपके स्वास्थ्य को समझते हैं।",bn:"চলুন আপনার স্বাস্থ্য বুঝি।",te:"మీ ఆరోగ్యాన్ని అర్థం చేసుకుందాం.",mr:"चला तुमचे आरोग्य समजून घेऊया.",ta:"உங்கள் உடல்நிலையைப் புரிந்துகொள்வோம்.",gu:"ચાલો તમારા સ્વાસ્થ્યને સમજીએ.",kn:"ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ.",ml:"നിങ്ങളുടെ ആരോഗ്യത്തെ മനസ്സിലാക്കാം.",pa:"ਆਓ ਤੁਹਾਡੀ ਸਿਹਤ ਨੂੰ ਸਮਝੀਏ.",or:"ଆସନ୍ତୁ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟକୁ ବୁଝିବା.",as:"আহক আপোনাৰ স্বাস্থ্য বুজি লওঁ.",ur:"آئیے آپ کی صحت کو سمجھتے ہیں۔",hinglish:"Chaliye aapki health ko samajhte hain."};
  const desc={en:"I’ll ask about your current issue, major health history and relevant risk factors, then organize your answers for your healthcare provider.",hi:"मैं आपकी वर्तमान समस्या, महत्वपूर्ण स्वास्थ्य इतिहास और संबंधित जोखिम कारकों के बारे में पूछूंगा और आपकी जानकारी डॉक्टर के लिए व्यवस्थित करूंगा।",bn:"আমি আপনার বর্তমান সমস্যা, গুরুত্বপূর্ণ স্বাস্থ্য ইতিহাস ও প্রাসঙ্গিক ঝুঁকি সম্পর্কে জিজ্ঞেস করে তথ্য চিকিৎসকের জন্য সাজাব।",te:"మీ ప్రస్తుత సమస్య, ముఖ్యమైన ఆరోగ్య చరిత్ర మరియు సంబంధిత ప్రమాద కారకాల గురించి అడిగి సమాచారాన్ని వైద్యుడి కోసం క్రమబద్ధీకరిస్తాను.",mr:"मी तुमची सध्याची समस्या, महत्त्वाचा आरोग्य इतिहास आणि संबंधित जोखीम घटक विचारून माहिती डॉक्टरसाठी व्यवस्थित करेन.",ta:"உங்கள் தற்போதைய பிரச்சினை, முக்கிய உடல்நல வரலாறு மற்றும் தொடர்புடைய ஆபத்து காரணிகள் பற்றி கேட்டு தகவலை மருத்துவருக்காக ஒழுங்குபடுத்துவேன்.",gu:"હું તમારી હાલની સમસ્યા, મહત્વપૂર્ણ આરોગ્ય ઇતિહાસ અને સંબંધિત જોખમ વિશે પૂછીને માહિતી ડૉક્ટર માટે ગોઠવીશ.",kn:"ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸಮಸ್ಯೆ, ಪ್ರಮುಖ ಆರೋಗ್ಯ ಇತಿಹಾಸ ಮತ್ತು ಸಂಬಂಧಿತ ಅಪಾಯಗಳ ಬಗ್ಗೆ ಕೇಳಿ ಮಾಹಿತಿಯನ್ನು ವೈದ್ಯರಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ.",ml:"നിലവിലെ പ്രശ്നം, പ്രധാന ആരോഗ്യചരിത്രം, ബന്ധപ്പെട്ട അപകടസാധ്യതകൾ എന്നിവ ചോദിച്ച് വിവരങ്ങൾ ഡോക്ടർക്കായി ക്രമീകരിക്കും.",pa:"ਮੈਂ ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਸਮੱਸਿਆ, ਮਹੱਤਵਪੂਰਨ ਸਿਹਤ ਇਤਿਹਾਸ ਅਤੇ ਸੰਬੰਧਿਤ ਜੋਖਮ ਬਾਰੇ ਪੁੱਛ ਕੇ ਜਾਣਕਾਰੀ ਡਾਕਟਰ ਲਈ ਤਿਆਰ ਕਰਾਂਗਾ.",or:"ମୁଁ ଆପଣଙ୍କ ବର୍ତ୍ତମାନ ସମସ୍ୟା, ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସ୍ୱାସ୍ଥ୍ୟ ଇତିହାସ ଓ ସମ୍ବନ୍ଧିତ ଝୁମ୍ପ ବିଷୟରେ ପଚାରିବି.",as:"মই আপোনাৰ বৰ্তমান সমস্যা, গুৰুত্বপূৰ্ণ স্বাস্থ্য ইতিহাস আৰু সম্পৰ্কিত ঝুঁকি সম্পৰ্কে সুধিম.",ur:"میں آپ کی موجودہ شکایت، اہم طبی تاریخ اور متعلقہ خطرات کے بارے میں پوچھوں گا اور معلومات ڈاکٹر کے لیے ترتیب دوں گا۔",hinglish:"Main aapki current problem, important health history aur relevant risk factors ke baare mein poochunga aur doctor ke liye info organize karunga."};
  if(qs("#jarvisHeroTitle"))qs("#jarvisHeroTitle").textContent=hero[jarvisLanguage]||hero.en;if(qs("#jarvisIntroTitle"))qs("#jarvisIntroTitle").textContent=intro[jarvisLanguage]||intro.en;if(qs("#jarvisIntroText"))qs("#jarvisIntroText").textContent=desc[jarvisLanguage]||desc.en;
}

// Rebuild language selectors after adding languages, without duplicate options.
function refreshLanguageSelectors(){
  qsa("#jarvisLanguage,#jarvisLanguageConsult").forEach(sel=>{
    const current=sel.value||jarvisLanguage;sel.innerHTML="";
    Object.entries(LANGUAGES).forEach(([key,v])=>{const o=document.createElement("option");o.value=key;o.textContent=v.name;sel.appendChild(o);});
    sel.value=LANGUAGES[current]?current:"en";
  });
}
setTimeout(refreshLanguageSelectors,0);
