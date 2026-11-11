// Strings for the patient-facing pages (English and Arabic).

export const strings = {
  en: {
    dir: 'ltr',
    locale: 'en-GB',
    switchTo: 'عربي',
    switchToLang: 'ar',
    title: 'Your medical file',
    intro: 'Enter the file number from your clinic card and the phone number you registered with.',
    fileNo: 'File no.',
    fileNumber: 'File number',
    phone: 'Phone number',
    openFile: 'Open my file',
    opening: 'Opening…',
    closeFile: 'Close file',
    privacy: 'Your file is only shown on this screen. Close it when you are done.',
    noMatch: 'No file matches this file number and phone number. Check both and try again, or ask at reception.',
    tooMany: 'Too many attempts. Wait 15 minutes, then try again.',
    offline: 'Cannot reach the clinic system. Check your internet connection and try again.',
    genericError: 'Something went wrong. Try again in a moment.',
    required: 'Enter your file number and phone number.',
    age: 'Age',
    years: (n) => `${n} years`,
    born: 'Date of birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    bloodType: 'Blood type',
    allergies: 'Allergies',
    chronicConditions: 'Chronic conditions',
    notes: "Doctor's notes",
    visits: 'Visits',
    noVisits: 'No visits recorded yet.',
    diagnosis: 'Diagnosis',
    prescription: 'Prescription',
    visitNotes: 'Notes',
    lastUpdated: (date) => `Last updated ${date}`,
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-EG',
    switchTo: 'English',
    switchToLang: 'en',
    title: 'ملفك الطبي',
    intro: 'اكتب رقم الملف الموجود على كارت العيادة ورقم الموبايل المسجّل به.',
    fileNo: 'ملف رقم',
    fileNumber: 'رقم الملف',
    phone: 'رقم الموبايل',
    openFile: 'افتح ملفي',
    opening: 'جارٍ الفتح…',
    closeFile: 'إغلاق الملف',
    privacy: 'ملفك يظهر على هذه الشاشة فقط. أغلقه عند الانتهاء.',
    noMatch: 'لا يوجد ملف بهذا الرقم ورقم الموبايل. راجع الرقمين وحاول مرة أخرى، أو اسأل الاستقبال.',
    tooMany: 'محاولات كثيرة. انتظر ١٥ دقيقة ثم حاول مرة أخرى.',
    offline: 'لا يمكن الاتصال بنظام العيادة. تأكد من اتصال الإنترنت وحاول مرة أخرى.',
    genericError: 'حدث خطأ. حاول مرة أخرى بعد قليل.',
    required: 'اكتب رقم الملف ورقم الموبايل.',
    age: 'السن',
    years: (n) => `${n.toLocaleString('ar-EG')} سنة`,
    born: 'تاريخ الميلاد',
    gender: 'النوع',
    male: 'ذكر',
    female: 'أنثى',
    bloodType: 'فصيلة الدم',
    allergies: 'الحساسية',
    chronicConditions: 'الأمراض المزمنة',
    notes: 'ملاحظات الطبيب',
    visits: 'الزيارات',
    noVisits: 'لا توجد زيارات مسجّلة بعد.',
    diagnosis: 'التشخيص',
    prescription: 'العلاج',
    visitNotes: 'ملاحظات',
    lastUpdated: (date) => `آخر تحديث ${date}`,
  },
};

const LANG_KEY = 'patient-lang';

export function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && strings[saved]) return saved;
  } catch {
    // ignore unavailable storage
  }
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore unavailable storage
  }
}
