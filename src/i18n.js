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
    documents: 'Reports and documents',
    documentsHint: 'Tap a document to open it.',
    noDocuments: 'No documents in your file yet.',
    addedByYou: 'Added by you',
    deleteDoc: 'Delete',
    deleteDocNamed: (title) => `Delete ${title}`,
    confirmDelete: (title) => `Delete “${title}” from your file?`,
    upload: {
      choose: 'Upload a PDF',
      hint: (mb) => `Add results or reports from outside the clinic. Up to ${mb} MB each.`,
      title: 'Document name',
      remove: 'Remove',
      removeFile: (name) => `Remove ${name}`,
      queue: 'PDFs ready to upload',
      notPdf: (name) => `“${name}” is not a PDF file.`,
      tooLarge: (name, mb) => `“${name}” is larger than ${mb} MB.`,
      tooMany: (max) => `Add up to ${max} PDFs at a time.`,
    },
    uploadButton: (n) => (n === 1 ? 'Upload to my file' : `Upload ${n} PDFs to my file`),
    uploading: 'Uploading…',
    uploaded: (n) =>
      n === 1
        ? 'Uploaded. The clinic can see it in your file.'
        : `${n} PDFs uploaded. The clinic can see them in your file.`,
    uploadErrors: {
      NOT_PDF: 'That file is not a PDF. Choose a PDF file.',
      TOO_LARGE: 'That PDF is too large. Choose a smaller file.',
      TOO_MANY_FILES: 'Too many PDFs at once. Upload fewer at a time.',
      UPLOAD_LIMIT: 'Your file has reached the limit of documents you can add. Ask at reception for help.',
      RATE_LIMITED: 'Too many uploads. Wait a while, then try again.',
      NOT_YOURS: 'You can only delete documents you added.',
      default: 'The upload did not finish. Check your connection and try again.',
    },
    expired: 'For your privacy, your file was closed. Enter your file number and phone number again.',
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
    documents: 'التقارير والمستندات',
    documentsHint: 'اضغط على المستند لفتحه.',
    noDocuments: 'لا توجد مستندات في ملفك بعد.',
    addedByYou: 'أضفته أنت',
    deleteDoc: 'حذف',
    deleteDocNamed: (title) => `حذف ${title}`,
    confirmDelete: (title) => `حذف «${title}» من ملفك؟`,
    upload: {
      choose: 'رفع ملف PDF',
      hint: (mb) => `أضف نتائج أو تقارير من خارج العيادة. حتى ${mb.toLocaleString('ar-EG')} ميجابايت للملف.`,
      title: 'اسم المستند',
      remove: 'إزالة',
      removeFile: (name) => `إزالة ${name}`,
      queue: 'ملفات جاهزة للرفع',
      notPdf: (name) => `«${name}» ليس ملف PDF.`,
      tooLarge: (name, mb) => `«${name}» أكبر من ${mb.toLocaleString('ar-EG')} ميجابايت.`,
      tooMany: (max) => `يمكنك رفع ${max.toLocaleString('ar-EG')} ملفات كحد أقصى في المرة.`,
    },
    uploadButton: (n) => (n === 1 ? 'رفع إلى ملفي' : `رفع ${n.toLocaleString('ar-EG')} ملفات إلى ملفي`),
    uploading: 'جارٍ الرفع…',
    uploaded: (n) => (n === 1 ? 'تم الرفع. يمكن للعيادة رؤيته في ملفك.' : 'تم الرفع. يمكن للعيادة رؤيتها في ملفك.'),
    uploadErrors: {
      NOT_PDF: 'هذا الملف ليس PDF. اختر ملف PDF.',
      TOO_LARGE: 'ملف PDF كبير جدًا. اختر ملفًا أصغر.',
      TOO_MANY_FILES: 'ملفات كثيرة في مرة واحدة. ارفع عددًا أقل.',
      UPLOAD_LIMIT: 'وصل ملفك للحد الأقصى من المستندات التي يمكنك إضافتها. اسأل الاستقبال للمساعدة.',
      RATE_LIMITED: 'محاولات رفع كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
      NOT_YOURS: 'يمكنك حذف المستندات التي أضفتها أنت فقط.',
      default: 'لم يكتمل الرفع. تأكد من اتصال الإنترنت وحاول مرة أخرى.',
    },
    expired: 'لحماية خصوصيتك تم إغلاق الملف. اكتب رقم الملف ورقم الموبايل مرة أخرى.',
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
