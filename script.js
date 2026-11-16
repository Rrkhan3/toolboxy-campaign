/**
 * ToolBoxy Share & Earn Campaign
 * Pure Vanilla JavaScript (ES6+) Single-Page Application Controller
 * 100% Client-Side, No Frameworks, No Backend Dependencies
 * 
 * New Reward Structure:
 * - Joining Campaign: NPR 500 (Claimed once on registration)
 * - Each Successful Referral: NPR 200
 * - Minimum Withdrawal: NPR 2,000
 * - Withdrawal Processing Window: 84 Hours (Estimated window, not guaranteed payment time)
 * 
 * Features:
 * - Welcome Entrance Popup Modal
 * - Pure Vanilla JS Canvas Confetti Engine (with reduced-motion accessibility)
 * - Confetti Triggers (Welcome, Quiz Completion, Joining Reward, Referral Milestones, NPR 2,000 Eligibility)
 * - 5-Question Interactive Quiz
 * - Participant Registration Form (Nepal Phone & Khalti Validation)
 * - Joining Bonus Award Notification (+NPR 500, duplicate prevention via LocalStorage)
 * - Referral Link Generator & "Share Campaign" / Social Sharing Integrations
 * - My Rewards & Withdrawal Dashboard (Joining NPR 500, Referrals, Earnings, Total, Remaining to Withdraw, Progress Bar)
 * - Withdrawal Request Modal & Confirmation Preview
 * - 84-Hour Countdown Processing Timer (LocalStorage Persistent)
 * - Withdrawal History Table & Interactive Testing Simulator
 */

// ==========================================================================
// 1. CONFIGURATION & EDITABLE CONSTANTS
// ==========================================================================
const BASE_WEBSITE_URL = 'https://toolboxy.xyz';
const REWARD_JOIN_AMOUNT_NPR = 500;
const REWARD_PER_REFERRAL_NPR = 200;
const MINIMUM_WITHDRAWAL_NPR = 2000;
const COUNTDOWN_DURATION_HOURS = 84;
const COUNTDOWN_DURATION_MS = COUNTDOWN_DURATION_HOURS * 60 * 60 * 1000;

// LocalStorage Keys
const STORAGE_KEY_CODE = 'toolboxy_referral_code';
const STORAGE_KEY_NAME = 'toolboxy_user_name';
const STORAGE_KEY_MOBILE = 'toolboxy_user_mobile';
const STORAGE_KEY_KHALTI = 'toolboxy_user_khalti';
const STORAGE_KEY_JOIN_AWARDED = 'toolboxy_join_reward_awarded';
const STORAGE_KEY_REWARDS = 'toolboxy_rewards_data';
const STORAGE_KEY_COUNTDOWN = 'toolboxy_withdrawal_countdown_end';
const STORAGE_KEY_HISTORY = 'toolboxy_withdrawal_history';
const STORAGE_KEY_STATUS = 'toolboxy_withdrawal_status';
const STORAGE_KEY_SEEN_WELCOME = 'toolboxy_seen_welcome';

// 5-Question Discovery Quiz about ToolBoxy & Online Utilities
const QUIZ_QUESTIONS = [
  {
    question: "What is ToolBoxy (toolboxy.xyz)?",
    options: [
      "A collection of free, browser-based online tools",
      "A paid video streaming entertainment platform",
      "An online video game store and launcher",
      "A commercial hardware and repair retailer"
    ],
    correctAnswer: 0
  },
  {
    question: "How much does it cost to use the tools on ToolBoxy?",
    options: [
      "A mandatory monthly subscription fee",
      "It is 100% free to use online",
      "An upfront NPR 500 security deposit",
      "Free for only 3 days before locking"
    ],
    correctAnswer: 1
  },
  {
    question: "What types of utilities can visitors find on a web toolbox site like ToolBoxy?",
    options: [
      "Car mechanical parts and auto accessories",
      "Digital tools for files, conversions, text, and calculations",
      "Home plumbing and electrical repair services",
      "Physical parcel freight and transport logistics"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the official web address to explore ToolBoxy's free tools?",
    options: [
      "https://toolboxy.xyz",
      "Only on television broadcast channels",
      "In printed weekly newspapers",
      "Through physical retail flyers"
    ],
    correctAnswer: 0
  },
  {
    question: "How much reward do you earn for every successful referral who joins through your link?",
    options: [
      "NPR 50",
      "NPR 100",
      "NPR 200",
      "NPR 500"
    ],
    correctAnswer: 2
  }
];

// Pre-written share message
const PRE_WRITTEN_SHARE_MESSAGE = (link) =>
  `Check out ToolBoxy (https://toolboxy.xyz) - a great collection of free online tools! Explore it with my invite link: ${link}`;


// ==========================================================================
// 2. APPLICATION STATE
// ==========================================================================
const state = {
  currentPage: 'page-welcome',
  quizIndex: 0,
  selectedOption: null,
  score: 0,
  user: {
    fullName: '',
    mobileNumber: '',
    khaltiNumber: '',
    consent: false
  },
  refCode: '',
  
  // Rewards & Withdrawal State
  joinRewardAwarded: false,
  rewards: {
    joiningReward: 0,
    referralsCount: 0,
    referralEarnings: 0,
    totalEarned: 0,
    pendingRewards: 0,
    availableBalance: 0
  },
  withdrawalStatus: 'Not Eligible', // 'Not Eligible' | 'Eligible' | 'Request Submitted' | 'Under Review' | 'Approved' | 'Paid' | 'Rejected'
  countdownEndTimestamp: null,
  countdownTimerId: null,
  withdrawalHistory: [],
  pendingWithdrawalData: null
};


// ==========================================================================
// 3. DOM ELEMENT REFERENCES
// ==========================================================================
const dom = {
  pages: document.querySelectorAll('.page'),
  btnStartNow: document.getElementById('btn-start-now'),
  btnReopenWelcome: document.getElementById('btn-reopen-welcome'),
  headerBtnDashboard: document.getElementById('header-btn-dashboard'),
  
  // Confetti Canvas
  confettiCanvas: document.getElementById('confetti-canvas'),

  // Welcome Popup Modal
  welcomePopupModal: document.getElementById('welcome-popup-modal'),
  btnPopupClose: document.getElementById('btn-popup-close'),
  btnPopupExplore: document.getElementById('btn-popup-explore'),
  btnPopupStart: document.getElementById('btn-popup-start'),

  // Quiz
  quizQuestionBox: document.getElementById('quiz-question-box'),
  quizCompletionBox: document.getElementById('quiz-completion-box'),
  quizProgressText: document.getElementById('quiz-progress-text'),
  quizProgressFill: document.getElementById('quiz-progress-fill'),
  quizQuestionTitle: document.getElementById('quiz-question-title'),
  quizOptionsContainer: document.getElementById('quiz-options-container'),
  btnQuizNext: document.getElementById('btn-quiz-next'),
  btnQuizContinue: document.getElementById('btn-quiz-continue'),

  // Registration Form
  form: document.getElementById('registration-form'),
  inputFullName: document.getElementById('input-fullname'),
  inputMobile: document.getElementById('input-mobile'),
  inputKhalti: document.getElementById('input-khalti'),
  inputConsent: document.getElementById('input-consent'),
  errorFullName: document.getElementById('error-fullname'),
  errorMobile: document.getElementById('error-mobile'),
  errorKhalti: document.getElementById('error-khalti'),
  errorConsent: document.getElementById('error-consent'),
  btnSubmitReg: document.getElementById('btn-submit-reg'),

  // Sharing Page & Milestone Tracker
  joinRewardBanner: document.getElementById('join-reward-banner'),
  inputReferralLink: document.getElementById('input-referral-link'),
  btnCopyLink: document.getElementById('btn-copy-link'),
  btnPrimaryShare: document.getElementById('btn-primary-share'),
  btnWebShare: document.getElementById('btn-web-share'),
  btnShareWhatsapp: document.getElementById('btn-share-whatsapp'),
  btnShareFacebook: document.getElementById('btn-share-facebook'),
  btnShareMessenger: document.getElementById('btn-share-messenger'),
  btnStartOver: document.getElementById('btn-start-over'),
  trackerFriendsBadge: document.getElementById('tracker-friends-badge'),
  mStep0: document.getElementById('m-step-0'),
  mStep5: document.getElementById('m-step-5'),
  mStep8: document.getElementById('m-step-8'),

  // Rewards Dashboard
  withdrawalStatusBadge: document.getElementById('withdrawal-status-badge'),
  metricJoiningReward: document.getElementById('metric-joining-reward'),
  metricReferralCount: document.getElementById('metric-referral-count'),
  metricReferralEarnings: document.getElementById('metric-referral-earnings'),
  metricTotalEarned: document.getElementById('metric-total-earned'),
  metricAvailableBalance: document.getElementById('metric-available-balance'),
  withdrawalProgressInfo: document.getElementById('withdrawal-progress-info'),
  withdrawalProgressPercent: document.getElementById('withdrawal-progress-percent'),
  withdrawalProgressFill: document.getElementById('withdrawal-progress-fill'),
  btnRequestWithdrawal: document.getElementById('btn-request-withdrawal'),

  // 84-Hour Countdown Component
  countdownCard: document.getElementById('countdown-card'),
  countdownTimerGrid: document.getElementById('countdown-timer-grid'),
  timerDays: document.getElementById('timer-days'),
  timerHours: document.getElementById('timer-hours'),
  timerMinutes: document.getElementById('timer-minutes'),
  timerSeconds: document.getElementById('timer-seconds'),
  countdownCompletedMsg: document.getElementById('countdown-completed-msg'),

  // Withdrawal History
  withdrawalHistoryList: document.getElementById('withdrawal-history-list'),

  // Demo Simulation Controls
  btnSimAdd1: document.getElementById('btn-sim-add-1'),
  btnSimReach5: document.getElementById('btn-sim-reach-5'),
  btnSimReach8: document.getElementById('btn-sim-reach-8'),
  btnSimFfTimer: document.getElementById('btn-sim-ff-timer'),
  btnSimResetRewards: document.getElementById('btn-sim-reset-rewards'),

  // Withdrawal Request Modal
  withdrawalModal: document.getElementById('withdrawal-modal'),
  btnCloseWithdrawalModal: document.getElementById('btn-close-withdrawal-modal'),
  btnCancelWithdrawal: document.getElementById('btn-cancel-withdrawal'),
  withdrawalForm: document.getElementById('withdrawal-form'),
  wFullName: document.getElementById('w-fullname'),
  wKhalti: document.getElementById('w-khalti'),
  wAmount: document.getElementById('w-amount'),
  wEligibleDisplay: document.getElementById('w-eligible-display'),
  wErrorFullName: document.getElementById('w-error-fullname'),
  wErrorKhalti: document.getElementById('w-error-khalti'),
  wErrorAmount: document.getElementById('w-error-amount'),

  // Confirmation Modal
  confirmWithdrawalModal: document.getElementById('confirm-withdrawal-modal'),
  btnCloseConfirmModal: document.getElementById('btn-close-confirm-modal'),
  btnBackConfirm: document.getElementById('btn-back-confirm'),
  btnFinalConfirmWithdrawal: document.getElementById('btn-final-confirm-withdrawal'),
  confirmNameVal: document.getElementById('confirm-name-val'),
  confirmKhaltiVal: document.getElementById('confirm-khalti-val'),
  confirmAmountVal: document.getElementById('confirm-amount-val'),

  // Toasts
  toastContainer: document.getElementById('toast-container')
};


// ==========================================================================
// 4. LIGHTWEIGHT PURE VANILLA JS CONFETTI ENGINE
// ==========================================================================
let confettiParticles = [];
let confettiAnimationId = null;

function initConfettiCanvas() {
  if (!dom.confettiCanvas) return;
  const canvas = dom.confettiCanvas;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
  if (dom.confettiCanvas) {
    dom.confettiCanvas.width = window.innerWidth;
    dom.confettiCanvas.height = window.innerHeight;
  }
});

function triggerCelebrationConfetti(count = 80, originX = 0.5, originY = 0.4) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  if (!dom.confettiCanvas) return;
  const canvas = dom.confettiCanvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  initConfettiCanvas();

  const colors = [
    '#3b82f6', '#8b5cf6', '#60a5fa', '#f59e0b',
    '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#facc15'
  ];

  const startX = canvas.width * originX;
  const startY = canvas.height * originY;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 4;
    confettiParticles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.18,
      drag: 0.96,
      decay: Math.random() * 0.015 + 0.008,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  if (!confettiAnimationId) {
    animateConfetti(ctx, canvas);
  }
}

function animateConfetti(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];

    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    p.opacity -= p.decay;

    if (p.opacity <= 0 || p.y > canvas.height + 20) {
      confettiParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.fillStyle = p.color;

    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  if (confettiParticles.length > 0) {
    confettiAnimationId = requestAnimationFrame(() => animateConfetti(ctx, canvas));
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiAnimationId = null;
  }
}


// ==========================================================================
// 5. NAVIGATION & VIEW SWITCHING
// ==========================================================================
function showPage(pageId) {
  state.currentPage = pageId;
  dom.pages.forEach(page => {
    if (page.id === pageId) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });

  if (state.refCode) {
    dom.headerBtnDashboard.style.display = 'inline-flex';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ==========================================================================
// 6. TOAST NOTIFICATION HELPER
// ==========================================================================
function showToast(message) {
  if (!dom.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3600);
}


// ==========================================================================
// 7. WELCOME POPUP CONTROLLER
// ==========================================================================
function showWelcomePopup() {
  if (!dom.welcomePopupModal) return;
  dom.welcomePopupModal.classList.add('active');
  setTimeout(() => {
    triggerCelebrationConfetti(90, 0.5, 0.35);
  }, 200);
}

function closeWelcomePopup() {
  if (!dom.welcomePopupModal) return;
  dom.welcomePopupModal.classList.remove('active');
  try {
    localStorage.setItem(STORAGE_KEY_SEEN_WELCOME, 'true');
  } catch (err) {}
}


// ==========================================================================
// 8. QUIZ CONTROLLER
// ==========================================================================
function initQuiz() {
  state.quizIndex = 0;
  state.selectedOption = null;
  state.score = 0;

  dom.quizQuestionBox.style.display = 'block';
  dom.quizCompletionBox.style.display = 'none';

  renderQuizQuestion();
  showPage('page-quiz');
}

function renderQuizQuestion() {
  const currentQ = QUIZ_QUESTIONS[state.quizIndex];
  const total = QUIZ_QUESTIONS.length;
  const currentNumber = state.quizIndex + 1;

  dom.quizProgressText.textContent = `Question ${currentNumber} of ${total}`;
  const percentage = (currentNumber / total) * 100;
  dom.quizProgressFill.style.width = `${percentage}%`;

  dom.quizQuestionTitle.textContent = currentQ.question;
  dom.quizOptionsContainer.innerHTML = '';
  state.selectedOption = null;
  dom.btnQuizNext.disabled = true;

  if (state.quizIndex === total - 1) {
    dom.btnQuizNext.textContent = 'Finish Quiz';
  } else {
    dom.btnQuizNext.textContent = 'Next Question →';
  }

  const optionLetters = ['A', 'B', 'C', 'D'];
  currentQ.options.forEach((optionText, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');

    btn.innerHTML = `
      <span class="option-indicator">${optionLetters[idx]}</span>
      <span class="option-text">${optionText}</span>
    `;

    btn.addEventListener('click', () => selectQuizOption(idx));
    dom.quizOptionsContainer.appendChild(btn);
  });
}

function selectQuizOption(optionIndex) {
  state.selectedOption = optionIndex;
  const buttons = dom.quizOptionsContainer.querySelectorAll('.option-btn');

  buttons.forEach((btn, idx) => {
    if (idx === optionIndex) {
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
    } else {
      btn.classList.remove('selected');
      btn.setAttribute('aria-checked', 'false');
    }
  });

  dom.btnQuizNext.disabled = false;
}

function handleQuizNext() {
  if (state.selectedOption === null) return;

  const currentQ = QUIZ_QUESTIONS[state.quizIndex];
  if (state.selectedOption === currentQ.correctAnswer) {
    state.score++;
  }

  if (state.quizIndex < QUIZ_QUESTIONS.length - 1) {
    state.quizIndex++;
    renderQuizQuestion();
  } else {
    dom.quizQuestionBox.style.display = 'none';
    dom.quizCompletionBox.style.display = 'block';
    
    setTimeout(() => {
      triggerCelebrationConfetti(100, 0.5, 0.4);
    }, 150);
  }
}


// ==========================================================================
// 9. FORM VALIDATION & NORMALIZATION
// ==========================================================================
function normalizeNepalPhone(phoneStr) {
  if (!phoneStr) return null;
  const cleaned = phoneStr.trim().replace(/[\s\-()]/g, '');
  const match = cleaned.match(/^(?:\+?977)?(9[78]\d{8})$/);
  return match ? match[1] : null;
}

function validateFullName(showError = true) {
  const value = dom.inputFullName.value.trim();
  const isValid = /^[A-Za-z\s]{3,}$/.test(value);

  if (isValid) {
    dom.inputFullName.classList.remove('invalid');
    dom.inputFullName.classList.add('valid');
    dom.errorFullName.textContent = '';
    return true;
  } else {
    dom.inputFullName.classList.remove('valid');
    if (showError) {
      dom.inputFullName.classList.add('invalid');
      if (value.length === 0) {
        dom.errorFullName.textContent = 'Full name is required.';
      } else if (value.length < 3) {
        dom.errorFullName.textContent = 'Full name must be at least 3 characters.';
      } else {
        dom.errorFullName.textContent = 'Please use letters and spaces only.';
      }
    }
    return false;
  }
}

function validateMobileNumber(showError = true) {
  const rawValue = dom.inputMobile.value;
  const normalized = normalizeNepalPhone(rawValue);

  if (normalized) {
    dom.inputMobile.classList.remove('invalid');
    dom.inputMobile.classList.add('valid');
    dom.errorMobile.textContent = '';
    return true;
  } else {
    dom.inputMobile.classList.remove('valid');
    if (showError) {
      dom.inputMobile.classList.add('invalid');
      if (!rawValue || rawValue.trim() === '') {
        dom.errorMobile.textContent = 'Mobile number is required.';
      } else {
        dom.errorMobile.textContent = 'Enter a valid 10-digit Nepal mobile number starting with 98 or 97.';
      }
    }
    return false;
  }
}

function validateKhaltiNumber(showError = true) {
  const rawValue = dom.inputKhalti.value;
  const normalized = normalizeNepalPhone(rawValue);

  if (normalized) {
    dom.inputKhalti.classList.remove('invalid');
    dom.inputKhalti.classList.add('valid');
    dom.errorKhalti.textContent = '';
    return true;
  } else {
    dom.inputKhalti.classList.remove('valid');
    if (showError) {
      dom.inputKhalti.classList.add('invalid');
      if (!rawValue || rawValue.trim() === '') {
        dom.errorKhalti.textContent = 'Khalti number is required.';
      } else {
        dom.errorKhalti.textContent = 'Enter a valid 10-digit Nepal Khalti mobile number (98 or 97).';
      }
    }
    return false;
  }
}

function validateConsent(showError = true) {
  const isChecked = dom.inputConsent.checked;
  if (isChecked) {
    dom.errorConsent.textContent = '';
    return true;
  } else {
    if (showError) {
      dom.errorConsent.textContent = 'You must confirm age and agree to campaign verification terms.';
    }
    return false;
  }
}

function handleRegistrationSubmit(e) {
  e.preventDefault();

  const isNameValid = validateFullName(true);
  const isMobileValid = validateMobileNumber(true);
  const isKhaltiValid = validateKhaltiNumber(true);
  const isConsentValid = validateConsent(true);

  if (!isNameValid || !isMobileValid || !isKhaltiValid || !isConsentValid) {
    showToast('Please correct the highlighted errors before proceeding.');
    return;
  }

  state.user.fullName = dom.inputFullName.value.trim();
  state.user.mobileNumber = normalizeNepalPhone(dom.inputMobile.value);
  state.user.khaltiNumber = normalizeNepalPhone(dom.inputKhalti.value);
  state.user.consent = true;

  try {
    localStorage.setItem(STORAGE_KEY_NAME, state.user.fullName);
    localStorage.setItem(STORAGE_KEY_MOBILE, state.user.mobileNumber);
    localStorage.setItem(STORAGE_KEY_KHALTI, state.user.khaltiNumber);
  } catch (err) {}

  ensureReferralCode();
  setupSharingPage();

  // Check and award Campaign Join Reward (Prevent duplicate join rewards)
  awardJoinReward();

  updateRewardsUI();
  showPage('page-sharing');
}


// ==========================================================================
// 10. CAMPAIGN JOIN REWARD CONTROLLER (NPR 500)
// ==========================================================================
function awardJoinReward() {
  let alreadyAwarded = false;
  try {
    alreadyAwarded = localStorage.getItem(STORAGE_KEY_JOIN_AWARDED) === 'true';
  } catch (err) {
    alreadyAwarded = false;
  }

  if (!alreadyAwarded) {
    // Award NPR 500 joining reward for the first time
    state.joinRewardAwarded = true;
    state.rewards.joiningReward = REWARD_JOIN_AMOUNT_NPR;
    try {
      localStorage.setItem(STORAGE_KEY_JOIN_AWARDED, 'true');
    } catch (err) {}

    // Show Join Reward Banner Notification
    if (dom.joinRewardBanner) {
      dom.joinRewardBanner.style.display = 'flex';
    }

    // Trigger celebration confetti
    setTimeout(() => {
      triggerCelebrationConfetti(110, 0.5, 0.35);
    }, 300);

    showToast("🎉 Congratulations! You've earned NPR 500 for joining the campaign.");
  } else {
    // Already awarded previously: maintain joining reward without adding duplicate
    state.joinRewardAwarded = true;
    state.rewards.joiningReward = REWARD_JOIN_AMOUNT_NPR;
    if (dom.joinRewardBanner) {
      dom.joinRewardBanner.style.display = 'flex';
    }
  }
}


// ==========================================================================
// 11. REFERRAL CODE & SHARING CONTROLLER
// ==========================================================================
function generateReferralCode(name) {
  let initials = 'TB';
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase().replace(/[^A-Z]/g, 'X');
    } else if (parts[0].length >= 2) {
      initials = parts[0].substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
    }
  }
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${initials}${randomPart}`;
}

function ensureReferralCode() {
  let existingCode = null;
  try {
    existingCode = localStorage.getItem(STORAGE_KEY_CODE);
  } catch (err) {
    existingCode = null;
  }

  if (!existingCode) {
    existingCode = generateReferralCode(state.user.fullName);
    try {
      localStorage.setItem(STORAGE_KEY_CODE, existingCode);
    } catch (err) {}
  }

  state.refCode = existingCode;
  return existingCode;
}

function getReferralLink() {
  const code = state.refCode || ensureReferralCode();
  return `${BASE_WEBSITE_URL}/?ref=${encodeURIComponent(code)}`;
}

function setupSharingPage() {
  const link = getReferralLink();
  dom.inputReferralLink.value = link;

  const shareText = PRE_WRITTEN_SHARE_MESSAGE(link);
  const encodedText = encodeURIComponent(shareText);
  const encodedLink = encodeURIComponent(link);

  // WhatsApp
  dom.btnShareWhatsapp.href = `https://wa.me/?text=${encodedText}`;

  // Facebook
  dom.btnShareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;

  // Primary Share Campaign Button
  dom.btnPrimaryShare.onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ToolBoxy Free Online Tools',
        text: shareText,
        url: link
      }).catch(() => {});
    } else {
      copyLinkToClipboard("Referral link copied! Share with your friends via WhatsApp, Messenger, or Facebook.");
    }
  };

  // Web Share API Button
  if (navigator.share) {
    dom.btnWebShare.style.display = 'inline-flex';
    dom.btnWebShare.onclick = async () => {
      try {
        await navigator.share({
          title: 'ToolBoxy Free Online Tools',
          text: shareText,
          url: link
        });
      } catch (err) {}
    };
  } else {
    dom.btnWebShare.style.display = 'none';
  }

  // Messenger fallback
  dom.btnShareMessenger.onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ToolBoxy Free Online Tools',
        text: shareText,
        url: link
      }).catch(() => {});
    } else {
      copyLinkToClipboard("Link copied! Open Messenger and paste it into your chat.");
    }
  };
}

function copyLinkToClipboard(customMessage = "Referral link copied to clipboard!") {
  const link = dom.inputReferralLink.value;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link)
      .then(() => showToast(customMessage))
      .catch(() => fallbackCopy(link, customMessage));
  } else {
    fallbackCopy(link, customMessage);
  }
}

function fallbackCopy(text, customMessage) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast(customMessage);
    } else {
      showToast("Please copy the link directly from the box.");
    }
  } catch (err) {
    showToast("Please copy the link directly from the box.");
  } finally {
    document.body.removeChild(textArea);
  }
}


// ==========================================================================
// 12. REWARDS & WITHDRAWAL DASHBOARD CONTROLLER
// ==========================================================================
function updateRewardsUI() {
  const joining = state.joinRewardAwarded ? REWARD_JOIN_AMOUNT_NPR : 0;
  state.rewards.joiningReward = joining;

  const count = state.rewards.referralsCount || 0;
  const referralEarnings = count * REWARD_PER_REFERRAL_NPR;
  state.rewards.referralEarnings = referralEarnings;

  const totalEarned = joining + referralEarnings;
  state.rewards.totalEarned = totalEarned;

  const pending = state.rewards.pendingRewards || 0;
  const availableBalance = Math.max(0, totalEarned - pending);
  state.rewards.availableBalance = availableBalance;

  // Update Milestone Badges
  dom.trackerFriendsBadge.textContent = `Invited Friends: ${count}`;
  if (count >= 5) {
    dom.mStep5.classList.add('active');
  } else {
    dom.mStep5.classList.remove('active');
  }

  if (count >= 8) {
    dom.mStep8.classList.add('active');
  } else {
    dom.mStep8.classList.remove('active');
  }

  // Update Financial Dashboard Metrics
  dom.metricJoiningReward.textContent = `NPR ${joining.toLocaleString()}`;
  dom.metricReferralCount.textContent = `${count} ${count === 1 ? 'Person' : 'People'}`;
  dom.metricReferralEarnings.textContent = `NPR ${referralEarnings.toLocaleString()}`;
  dom.metricTotalEarned.textContent = `NPR ${totalEarned.toLocaleString()}`;
  dom.metricAvailableBalance.textContent = `NPR ${availableBalance.toLocaleString()}`;

  // Update Progress Card to NPR 2,000
  const progressRatio = Math.min(1, availableBalance / MINIMUM_WITHDRAWAL_NPR);
  const percentage = Math.floor(progressRatio * 100);
  const remaining = Math.max(0, MINIMUM_WITHDRAWAL_NPR - availableBalance);

  dom.withdrawalProgressPercent.textContent = `${percentage}%`;
  dom.withdrawalProgressFill.style.width = `${percentage}%`;

  if (remaining === 0) {
    dom.withdrawalProgressInfo.textContent = `Current Balance: NPR ${availableBalance.toLocaleString()} | Remaining Amount to Withdraw: NPR 0 (Ready to Withdraw!)`;
  } else {
    dom.withdrawalProgressInfo.textContent = `Current Balance: NPR ${availableBalance.toLocaleString()} | Remaining Amount to Withdraw: NPR ${remaining.toLocaleString()}`;
  }

  // Check Eligibility & Update Button
  const isEligible = availableBalance >= MINIMUM_WITHDRAWAL_NPR;

  if (isEligible) {
    dom.btnRequestWithdrawal.disabled = false;
    if (state.withdrawalStatus === 'Not Eligible') {
      setWithdrawalStatus('Eligible');
    }
  } else {
    dom.btnRequestWithdrawal.disabled = true;
    if (state.withdrawalStatus === 'Eligible') {
      setWithdrawalStatus('Not Eligible');
    }
  }

  updateStatusBadge();
  renderWithdrawalHistory();
  saveRewardsState();
}

function setWithdrawalStatus(newStatus) {
  state.withdrawalStatus = newStatus;
  try {
    localStorage.setItem(STORAGE_KEY_STATUS, newStatus);
  } catch (err) {}
  updateStatusBadge();
}

function updateStatusBadge() {
  const badge = dom.withdrawalStatusBadge;
  if (!badge) return;

  const status = state.withdrawalStatus || 'Not Eligible';
  badge.textContent = status;
  badge.className = 'badge-status';

  switch (status) {
    case 'Eligible':
      badge.classList.add('status-eligible');
      break;
    case 'Request Submitted':
      badge.classList.add('status-submitted');
      break;
    case 'Under Review':
      badge.classList.add('status-review');
      break;
    case 'Approved':
      badge.classList.add('status-approved');
      break;
    case 'Paid':
      badge.classList.add('status-paid');
      break;
    case 'Rejected':
      badge.classList.add('status-rejected');
      break;
    case 'Not Eligible':
    default:
      badge.classList.add('status-not-eligible');
      break;
  }
}

function saveRewardsState() {
  try {
    localStorage.setItem(STORAGE_KEY_REWARDS, JSON.stringify(state.rewards));
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(state.withdrawalHistory));
  } catch (err) {}
}

function loadSavedRewardsState() {
  try {
    // Check if joining reward was already awarded
    const joinAwarded = localStorage.getItem(STORAGE_KEY_JOIN_AWARDED) === 'true';
    if (joinAwarded) {
      state.joinRewardAwarded = true;
      if (dom.joinRewardBanner) {
        dom.joinRewardBanner.style.display = 'flex';
      }
    }

    const savedRewards = localStorage.getItem(STORAGE_KEY_REWARDS);
    if (savedRewards) {
      const parsed = JSON.parse(savedRewards);
      state.rewards.referralsCount = parsed.referralsCount || 0;
      state.rewards.pendingRewards = parsed.pendingRewards || 0;
    }

    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) {
      state.withdrawalHistory = JSON.parse(savedHistory);
    }

    const savedStatus = localStorage.getItem(STORAGE_KEY_STATUS);
    if (savedStatus) {
      state.withdrawalStatus = savedStatus;
    }

    const savedCountdown = localStorage.getItem(STORAGE_KEY_COUNTDOWN);
    if (savedCountdown) {
      state.countdownEndTimestamp = parseInt(savedCountdown, 10);
      startCountdownTimer();
    }
  } catch (err) {}
}


// ==========================================================================
// 13. 84-HOUR PROCESSING COUNTDOWN CONTROLLER
// ==========================================================================
function startCountdownTimer() {
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }

  if (!state.countdownEndTimestamp) {
    dom.countdownCard.style.display = 'none';
    return;
  }

  dom.countdownCard.style.display = 'block';

  function updateTimer() {
    const now = Date.now();
    const remainingMs = state.countdownEndTimestamp - now;

    if (remainingMs <= 0) {
      clearInterval(state.countdownTimerId);
      state.countdownTimerId = null;
      dom.countdownTimerGrid.style.display = 'none';
      dom.countdownCompletedMsg.style.display = 'block';
      dom.countdownCompletedMsg.textContent = 'Processing window completed. Please check your withdrawal status.';
      return;
    }

    dom.countdownTimerGrid.style.display = 'flex';
    dom.countdownCompletedMsg.style.display = 'none';

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    dom.timerDays.textContent = String(days).padStart(2, '0');
    dom.timerHours.textContent = String(hours).padStart(2, '0');
    dom.timerMinutes.textContent = String(minutes).padStart(2, '0');
    dom.timerSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  state.countdownTimerId = setInterval(updateTimer, 1000);
}


// ==========================================================================
// 14. WITHDRAWAL HISTORY RENDERER
// ==========================================================================
function renderWithdrawalHistory() {
  const container = dom.withdrawalHistoryList;
  if (!container) return;

  if (state.withdrawalHistory.length === 0) {
    container.innerHTML = '<div class="empty-history">No withdrawal requests submitted yet.</div>';
    return;
  }

  container.innerHTML = '';
  state.withdrawalHistory.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-item-left">
        <span class="history-item-amount">NPR ${item.amount.toLocaleString()}</span>
        <span class="history-item-date">${item.date} • Khalti: ${item.khalti}</span>
      </div>
      <span class="badge-status status-${getStatusClass(item.status)}">${item.status}</span>
    `;
    container.appendChild(div);
  });
}

function getStatusClass(status) {
  switch (status) {
    case 'Eligible': return 'eligible';
    case 'Request Submitted': return 'submitted';
    case 'Under Review': return 'review';
    case 'Approved': return 'approved';
    case 'Paid': return 'paid';
    case 'Rejected': return 'rejected';
    default: return 'not-eligible';
  }
}


// ==========================================================================
// 15. WITHDRAWAL REQUEST MODAL & CONFIRMATION
// ==========================================================================
function openWithdrawalModal() {
  if (state.rewards.availableBalance < MINIMUM_WITHDRAWAL_NPR) {
    showToast(`Minimum withdrawal requirement is NPR ${MINIMUM_WITHDRAWAL_NPR.toLocaleString()}.`);
    return;
  }

  dom.wFullName.value = state.user.fullName || '';
  dom.wKhalti.value = state.user.khaltiNumber || '';
  dom.wAmount.value = state.rewards.availableBalance;
  dom.wAmount.max = state.rewards.availableBalance;
  dom.wEligibleDisplay.textContent = `NPR ${state.rewards.availableBalance.toLocaleString()}`;

  dom.wErrorFullName.textContent = '';
  dom.wErrorKhalti.textContent = '';
  dom.wErrorAmount.textContent = '';

  dom.withdrawalModal.style.display = 'flex';
  dom.withdrawalModal.classList.add('active');
}

function closeWithdrawalModal() {
  dom.withdrawalModal.classList.remove('active');
  dom.withdrawalModal.style.display = 'none';
}

function handleWithdrawalFormSubmit(e) {
  e.preventDefault();

  const name = dom.wFullName.value.trim();
  const khaltiRaw = dom.wKhalti.value;
  const khalti = normalizeNepalPhone(khaltiRaw);
  const amount = parseInt(dom.wAmount.value, 10);

  let hasError = false;

  if (!name || name.length < 3) {
    dom.wErrorFullName.textContent = 'Please enter your full name (min. 3 characters).';
    hasError = true;
  } else {
    dom.wErrorFullName.textContent = '';
  }

  if (!khalti) {
    dom.wErrorKhalti.textContent = 'Enter a valid 10-digit Nepal Khalti mobile number (starting with 98 or 97).';
    hasError = true;
  } else {
    dom.wErrorKhalti.textContent = '';
  }

  if (isNaN(amount) || amount < MINIMUM_WITHDRAWAL_NPR) {
    dom.wErrorAmount.textContent = `Minimum withdrawal amount is NPR ${MINIMUM_WITHDRAWAL_NPR.toLocaleString()}.`;
    hasError = true;
  } else if (amount > state.rewards.availableBalance) {
    dom.wErrorAmount.textContent = `Amount cannot exceed available balance of NPR ${state.rewards.availableBalance.toLocaleString()}.`;
    hasError = true;
  } else {
    dom.wErrorAmount.textContent = '';
  }

  if (hasError) return;

  state.pendingWithdrawalData = { name, khalti, amount };

  dom.confirmNameVal.textContent = name;
  dom.confirmKhaltiVal.textContent = khalti;
  dom.confirmAmountVal.textContent = `NPR ${amount.toLocaleString()}`;

  closeWithdrawalModal();
  dom.confirmWithdrawalModal.style.display = 'flex';
  dom.confirmWithdrawalModal.classList.add('active');
}

function closeConfirmModal() {
  dom.confirmWithdrawalModal.classList.remove('active');
  dom.confirmWithdrawalModal.style.display = 'none';
}

function finalizeWithdrawalRequest() {
  if (!state.pendingWithdrawalData) return;

  const { name, khalti, amount } = state.pendingWithdrawalData;

  state.rewards.pendingRewards += amount;

  const newRecord = {
    id: `REQ-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    name,
    khalti,
    amount,
    status: 'Under Review'
  };

  state.withdrawalHistory.unshift(newRecord);
  setWithdrawalStatus('Under Review');

  // Start 84-Hour Countdown
  state.countdownEndTimestamp = Date.now() + COUNTDOWN_DURATION_MS;
  try {
    localStorage.setItem(STORAGE_KEY_COUNTDOWN, String(state.countdownEndTimestamp));
  } catch (err) {}

  startCountdownTimer();
  updateRewardsUI();

  closeConfirmModal();
  state.pendingWithdrawalData = null;

  showToast('Withdrawal request preview recorded! 84-hour estimated processing window started.');
}


// ==========================================================================
// 16. INTERACTIVE TESTING SIMULATOR
// ==========================================================================

// Simulate +1 Referral (+NPR 200)
function simulateAdd1Referral() {
  // Ensure join reward is active
  if (!state.joinRewardAwarded) {
    awardJoinReward();
  }

  state.rewards.referralsCount += 1;
  const newReferrals = state.rewards.referralsCount;
  const newTotal = state.rewards.joiningReward + (newReferrals * REWARD_PER_REFERRAL_NPR);

  if (newTotal >= MINIMUM_WITHDRAWAL_NPR && state.withdrawalStatus !== 'Eligible' && state.withdrawalStatus !== 'Under Review') {
    triggerCelebrationConfetti(120, 0.5, 0.35);
    showToast(`🚀 Referral added (+NPR 200)! Total: NPR ${newTotal.toLocaleString()}. Minimum withdrawal reached!`);
  } else {
    showToast(`Referral added (+NPR 200)! Total Estimated: NPR ${newTotal.toLocaleString()}`);
  }

  updateRewardsUI();
}

// Simulate 5 Referrals (+NPR 1,000 -> Total NPR 1,500)
function simulateReach5Referrals() {
  if (!state.joinRewardAwarded) {
    awardJoinReward();
  }

  state.rewards.referralsCount = 5;
  triggerCelebrationConfetti(110, 0.5, 0.35);
  showToast('🎉 5 Referrals Simulated (+NPR 1,000)! Total with joining bonus: NPR 1,500.');
  updateRewardsUI();
}

// Simulate 8 Referrals (+NPR 1,600 -> Total NPR 2,100 -> Eligible!)
function simulateReach8Referrals() {
  if (!state.joinRewardAwarded) {
    awardJoinReward();
  }

  state.rewards.referralsCount = 8;
  triggerCelebrationConfetti(130, 0.5, 0.35);
  showToast('🚀 8 Referrals Simulated (+NPR 1,600)! Total: NPR 2,100. Minimum withdrawal eligibility unlocked!');
  updateRewardsUI();
}

// Fast-Forward Countdown Timer to 5 seconds remaining
function simulateFastForwardTimer() {
  if (!state.countdownEndTimestamp) {
    showToast('No active countdown running. Submit a withdrawal request first!');
    return;
  }
  state.countdownEndTimestamp = Date.now() + 5000;
  try {
    localStorage.setItem(STORAGE_KEY_COUNTDOWN, String(state.countdownEndTimestamp));
  } catch (err) {}
  startCountdownTimer();
  showToast('Timer fast-forwarded: 5 seconds remaining until completion.');
}

// Reset Demo Rewards
function simulateResetRewards() {
  state.rewards = {
    joiningReward: state.joinRewardAwarded ? REWARD_JOIN_AMOUNT_NPR : 0,
    referralsCount: 0,
    referralEarnings: 0,
    totalEarned: state.joinRewardAwarded ? REWARD_JOIN_AMOUNT_NPR : 0,
    pendingRewards: 0,
    availableBalance: state.joinRewardAwarded ? REWARD_JOIN_AMOUNT_NPR : 0
  };
  state.withdrawalStatus = 'Not Eligible';
  state.withdrawalHistory = [];
  state.countdownEndTimestamp = null;

  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }

  try {
    localStorage.removeItem(STORAGE_KEY_REWARDS);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_STATUS);
    localStorage.removeItem(STORAGE_KEY_COUNTDOWN);
  } catch (err) {}

  dom.countdownCard.style.display = 'none';
  updateRewardsUI();
  showToast('Demo referral rewards and withdrawal history reset.');
}

// Full Start Over: Clears storage & state, returns to Page 1
function handleStartOver() {
  try {
    localStorage.clear();
  } catch (err) {}

  state.currentPage = 'page-welcome';
  state.quizIndex = 0;
  state.selectedOption = null;
  state.score = 0;
  state.user = { fullName: '', mobileNumber: '', khaltiNumber: '', consent: false };
  state.refCode = '';
  state.joinRewardAwarded = false;

  if (dom.joinRewardBanner) {
    dom.joinRewardBanner.style.display = 'none';
  }

  simulateResetRewards();

  if (dom.form) {
    dom.form.reset();
    [dom.inputFullName, dom.inputMobile, dom.inputKhalti].forEach(input => {
      input.classList.remove('valid', 'invalid');
    });
    [dom.errorFullName, dom.errorMobile, dom.errorKhalti, dom.errorConsent].forEach(errEl => {
      errEl.textContent = '';
    });
  }

  dom.headerBtnDashboard.style.display = 'none';
  showPage('page-welcome');
  showToast('Session reset. Welcome back!');
}


// ==========================================================================
// 17. EVENT LISTENERS & INITIALIZATION
// ==========================================================================
function initEvents() {
  // Welcome Popup Actions
  dom.btnPopupClose.addEventListener('click', closeWelcomePopup);
  dom.btnPopupExplore.addEventListener('click', () => {
    closeWelcomePopup();
    showPage('page-welcome');
  });
  dom.btnPopupStart.addEventListener('click', () => {
    closeWelcomePopup();
    initQuiz();
  });

  // Reopen Welcome popup from Page 1
  dom.btnReopenWelcome.addEventListener('click', showWelcomePopup);

  // Keyboard accessibility: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.welcomePopupModal.classList.contains('active')) closeWelcomePopup();
      if (dom.withdrawalModal.classList.contains('active')) closeWithdrawalModal();
      if (dom.confirmWithdrawalModal.classList.contains('active')) closeConfirmModal();
    }
  });

  // Header Dashboard shortcut
  dom.headerBtnDashboard.addEventListener('click', () => {
    showPage('page-sharing');
  });

  // Page 1 -> Page 2
  dom.btnStartNow.addEventListener('click', initQuiz);

  // Page 2: Quiz Controls
  dom.btnQuizNext.addEventListener('click', handleQuizNext);
  dom.btnQuizContinue.addEventListener('click', () => {
    showPage('page-register');
  });

  // Page 3: Real-Time Input Validation
  dom.inputFullName.addEventListener('input', () => validateFullName(false));
  dom.inputFullName.addEventListener('blur', () => validateFullName(true));

  dom.inputMobile.addEventListener('input', () => validateMobileNumber(false));
  dom.inputMobile.addEventListener('blur', () => validateMobileNumber(true));

  dom.inputKhalti.addEventListener('input', () => validateKhaltiNumber(false));
  dom.inputKhalti.addEventListener('blur', () => validateKhaltiNumber(true));

  dom.inputConsent.addEventListener('change', () => validateConsent(true));

  // Form Submit
  dom.form.addEventListener('submit', handleRegistrationSubmit);

  // Page 4: Sharing Actions
  dom.btnCopyLink.addEventListener('click', () => copyLinkToClipboard());
  dom.btnStartOver.addEventListener('click', handleStartOver);

  // Rewards & Withdrawal Action Area
  dom.btnRequestWithdrawal.addEventListener('click', openWithdrawalModal);
  dom.btnCloseWithdrawalModal.addEventListener('click', closeWithdrawalModal);
  dom.btnCancelWithdrawal.addEventListener('click', closeWithdrawalModal);
  dom.withdrawalForm.addEventListener('submit', handleWithdrawalFormSubmit);

  // Confirmation Modal Actions
  dom.btnCloseConfirmModal.addEventListener('click', closeConfirmModal);
  dom.btnBackConfirm.addEventListener('click', () => {
    closeConfirmModal();
    openWithdrawalModal();
  });
  dom.btnFinalConfirmWithdrawal.addEventListener('click', finalizeWithdrawalRequest);

  // Demo Simulation Controls
  dom.btnSimAdd1.addEventListener('click', simulateAdd1Referral);
  dom.btnSimReach5.addEventListener('click', simulateReach5Referrals);
  dom.btnSimReach8.addEventListener('click', simulateReach8Referrals);
  dom.btnSimFfTimer.addEventListener('click', simulateFastForwardTimer);
  dom.btnSimResetRewards.addEventListener('click', simulateResetRewards);
}

// Initial Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  initConfettiCanvas();
  initEvents();
  loadSavedRewardsState();

  let savedCode = null;
  try {
    savedCode = localStorage.getItem(STORAGE_KEY_CODE);
  } catch (err) {}

  if (savedCode) {
    state.refCode = savedCode;
    try {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME);
      if (savedName) state.user.fullName = savedName;
      const savedMobile = localStorage.getItem(STORAGE_KEY_MOBILE);
      if (savedMobile) state.user.mobileNumber = savedMobile;
      const savedKhalti = localStorage.getItem(STORAGE_KEY_KHALTI);
      if (savedKhalti) state.user.khaltiNumber = savedKhalti;
    } catch (err) {}
    setupSharingPage();
    dom.headerBtnDashboard.style.display = 'inline-flex';
  }

  updateRewardsUI();
  showWelcomePopup();

  // Register Service Worker safely (avoid duplicate registration, handle errors safely)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          const alreadyRegistered = registrations.some(r => r.active && r.active.scriptURL.includes('sw.js'));
          if (!alreadyRegistered) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
              .catch((err) => {
                console.warn('Service Worker registration skipped:', err);
              });
          }
        })
        .catch(() => {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .catch(() => {});
        });
    });
  }
});
