let currentUser = null;
let authEpoch = 0;
let courseBusy = false;
let courseReady = false;
let courseLoading = false;
const authMessage = document.getElementById('auth-message');

function reportCourseError(error) {
  document.getElementById('course-status').textContent =
    '課程操作失敗：' + (error.message || error) + '。請檢查網路、資料表及 RLS 設定，再重試。';
}
async function applySession(session) {
  const user = session?.user || null;
  if (user?.id && user.id === currentUser?.id) return;
  const epoch = ++authEpoch;
  currentUser = user;
  courseReady = false;
  courseLoading = false;
  courses = [];
  resetCourseForm();
  resetTimer();
  closeEventModal();
  document.getElementById('calendar-view-container').replaceChildren();
  switchTab('dashboard');
  loadLocalFeatures(user?.id);
  updateDashboard();
  document.querySelectorAll('[data-auth-required]').forEach(el => {el.hidden = !user;});
  document.getElementById('auth-panel').hidden = !!user;
  document.getElementById('account-panel').hidden = !user;
  document.getElementById('account-email').textContent = user?.email || '';
  document.getElementById('course-status').textContent = '';
  if (!user) return;
  courseLoading = true;
  document.getElementById('course-status').textContent = '正在從雲端讀取課程…';
  try {
    const rows = await courseService.list();
    if (epoch !== authEpoch) return;
    courses = rows;
    courseReady = true;
    updateDashboard();
    document.getElementById('course-status').textContent = '課程已從雲端載入。';
  } catch(error) {if (epoch === authEpoch) reportCourseError(error);}
  finally {if (epoch === authEpoch) courseLoading = false;}
}

document.getElementById('auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const action = event.submitter?.value || 'login';
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const buttons = document.querySelectorAll('#auth-form button');
  buttons.forEach(b => {b.disabled = true;});
  authMessage.textContent = '處理中…';
  try {
    if (!window.studyClient) throw new Error('Supabase 程式庫未載入，請確認網路後重新整理');
    const result = action === 'signup'
      ? await studyClient.auth.signUp({email, password, options:{emailRedirectTo:new URL('./',location.href).href}})
      : await studyClient.auth.signInWithPassword({email, password});
    if (result.error) throw result.error;
    document.getElementById('auth-password').value = '';
    authMessage.textContent = action === 'signup' && !result.data.session
      ? '註冊請求已送出，請查看驗證信；既有帳號請直接登入。' : '登入成功。';
    if (result.data.session) await applySession(result.data.session);
  } catch(error) {authMessage.textContent = '無法完成：' + error.message;}
  finally {buttons.forEach(b => {b.disabled = false;});}
});
document.getElementById('logout-button').addEventListener('click', async () => {
  const button = document.getElementById('logout-button');
  button.disabled = true;
  try {
    const {error} = await studyClient.auth.signOut();
    if (error) throw error;
    await applySession(null);
    authMessage.textContent = '已登出。';
  } catch(error) {reportCourseError(error);}
  finally {button.disabled = false;}
});
document.getElementById('course-cancel').addEventListener('click',resetCourseForm);
document.getElementById('course-reload').addEventListener('click',async () => {
  if (!currentUser || courseBusy || courseLoading) return;
  const epoch = authEpoch;
  courseBusy = true;
  try {
    const rows = await courseService.list();
    if (epoch !== authEpoch) return;
    courses = rows;
    courseReady = true;
    updateDashboard();
    document.getElementById('course-status').textContent = '已重新讀取雲端課程。';
  } catch(error) {if (epoch === authEpoch) reportCourseError(error);}
  finally {courseBusy = false;}
});
if (window.studyClient) {
  // Do not await other Supabase requests inside the SDK's auth callback.
  studyClient.auth.onAuthStateChange((_event,session) => {
    setTimeout(() => {applySession(session).catch(reportCourseError);},0);
  });
} else {
  authMessage.textContent = 'Supabase 程式庫載入失敗。請檢查網路後重新整理。';
}
