/**
 name         AO3 Translator - 词库
 namespace    https://github.com/V-Lipset/ao3-chinese
 version      1.6.1-2026-02-03
 description  AO3 Translator 的词库文件
 author       V-Lipset
 license      GPL-3.0
 supportURL   https://github.com/V-Lipset/ao3-chinese/issues
*/

/**************************************************************************
 * 特殊翻译函数与 DOM 操作
 **************************************************************************/

/**
 * 专用翻译函数：翻译首次登录的帮助横幅
 */
function translateFirstLoginBanner() {
	const banner = document.querySelector('#first-login-help-banner');
	if (!banner || banner.hasAttribute('data-translated-by-custom-function')) {
		return;
	}
	const translatedHTML = `
        <p>
        嗨！看起来这是您首次登录 AO3 。如需了解如何使用 AO3 ，请查看一些<a href="/first_login_help">新用户实用技巧</a>，或浏览<a href="/faq">我们的常见问题解答</a>。
        </p>
        <p>
        如果您需要技术支持，请<a href="/support">联系我们的支持团队</a>；如果您遇到骚扰或对我们的<a href="/tos">服务条款</a>（包括<a href="/content">内容政策</a>和<a href="/privacy">隐私政策</a>）有疑问，请<a href="/abuse_reports/new">联系我们的政策与滥用团队</a>。
        </p>
        <form action="${banner.querySelector('form')?.action || ''}" accept-charset="UTF-8" data-remote="true" method="post">
            <input type="hidden" name="authenticity_token" value="${banner.querySelector('input[name=authenticity_token]')?.value || ''}" autocomplete="off">
            <p class="submit actions">
                <input type="submit" name="commit" value="永久关闭此信息">
                <a id="hide-first-login-help" title="隐藏首次登录帮助横幅" data-remote="true" href="${banner.querySelector('a#hide-first-login-help')?.href || ''}">×</a>
            </p>
        </form>
    `;
	banner.innerHTML = translatedHTML;
	banner.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用翻译函数：翻译未登录时首页的介绍模块
 */
function translateFrontPageIntro() {
	const introDiv = document.querySelector('div.intro.module.odd');
	if (!introDiv || introDiv.hasAttribute('data-translated-by-custom-function')) {
		return;
	}
	const h2 = introDiv.querySelector('h2.heading');
	if (h2) {
		h2.textContent = '一个由同人爱好者创建、由同人爱好者运营的非营利、非商业存档，收录再创作同人作品，如同人小说、同人画作、同人视频和同人有声作品';
	}

	const statsP = introDiv.querySelector('p.stats');
	if (statsP) {
		const counts = statsP.querySelectorAll('span.count');
		if (counts.length === 3) {
			statsP.innerHTML = `超过 <span class="count">${counts[0].textContent}</span> 个同人圈 | <span class="count">${counts[1].textContent}</span> 名用户 | <span class="count">${counts[2].textContent}</span> 篇作品`;
		}
	}

	const parentP = introDiv.querySelector('p.parent');
	if (parentP) {
		const link = parentP.querySelector('a');
		if (link) {
			link.textContent = '再创作组织';
			parentP.innerHTML = `Archive of Our Own 是隶属于${link.outerHTML}的一个项目。`;
		}
	}

	const accountDiv = introDiv.querySelector('div.account.module');
	if (accountDiv) {
		const h4 = accountDiv.querySelector('h4.heading');
		if (h4) {
			h4.textContent = '拥有 AO3 账户，您可以：';
		}

		const listItems = accountDiv.querySelectorAll('ul li');
		const translations = [
			'分享您自己的同人作品',
			'在您喜欢的作品、系列或用户更新时收到通知',
			'参与各种活动',
			'记录您已浏览以及想要稍后查看的作品'
		];
		listItems.forEach((item, index) => {
			if (translations[index]) {
				item.textContent = translations[index];
			}
		});
		const paragraphs = accountDiv.querySelectorAll('p');
		paragraphs.forEach(p => {
			if (p.textContent.includes('You can join by getting an invitation')) {
				p.textContent = '您可以通过我们的自动邀请队列获取邀请。所有同人爱好者和同人作品均受欢迎！';
			} else if (p.classList.contains('actions')) {
				const inviteLink = p.querySelector('a');
				if (inviteLink) {
					inviteLink.textContent = '获取邀请！';
				}
			}
		});
	}
	introDiv.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用翻译函数：翻译邀请请求页面
 */
function translateInvitationRequestsPage() {
	function translateEnglishDate(englishDate) {
		const monthFullNameMap = {
			'January': '1', 'February': '2', 'March': '3', 'April': '4', 'May': '5', 'June': '6',
			'July': '7', 'August': '8', 'September': '9', 'October': '10', 'November': '11', 'December': '12'
		};
		const dateParts = englishDate.trim().match(/(\w+)\s(\d{1,2}),\s(\d{4})/);
		if (dateParts && dateParts.length === 4) {
			const monthName = dateParts[1];
			const day = dateParts[2];
			const year = dateParts[3];
			if (monthFullNameMap[monthName]) {
				const paddedDay = day.padStart(2, '0');
				return `${year} 年 ${monthFullNameMap[monthName]} 月 ${paddedDay} 日`;
			}
		}
		return englishDate;
	}

	const mainDiv = document.querySelector('div#main[class*="invite_requests-"]');

	if (!mainDiv) {
		return;
	}
	const isAlreadyHandled = mainDiv.hasAttribute('data-translated-by-custom-function');
	const inviteStatusDiv = mainDiv.querySelector('#invite-status');
	const statusHasContent = inviteStatusDiv && inviteStatusDiv.innerHTML.trim() !== '';

	if (isAlreadyHandled && !statusHasContent) {
		return;
	}

	if (!isAlreadyHandled) {
		const h2 = mainDiv.querySelector('h2.heading');
		if (h2) {
			const h2Text = h2.textContent.trim();
			if (h2Text === 'Invitation Requests') {
				h2.textContent = '邀请请求';
			} else if (h2Text === 'Invitation Request Status') {
				h2.textContent = '邀请请求状态';
			}
		}

		const firstP = Array.from(mainDiv.querySelectorAll('p')).find(p => p.textContent.includes('To get a free Archive of Our Own account'));
		if (firstP) {
			const tosLink = firstP.querySelector('a[href="/tos"]');
			const contentLink = firstP.querySelector('a[href="/content"]');
			const privacyLink = firstP.querySelector('a[href="/privacy"]');
			if (tosLink && contentLink && privacyLink) {
				tosLink.textContent = '服务条款';
				contentLink.textContent = '内容政策';
				privacyLink.textContent = '隐私政策';
				firstP.innerHTML = `要获得免费的 AO3 账户，您需要一份邀请。将您的电子邮箱地址提交到我们的邀请队列，即表示您确认自己已年满 13 周岁；如果您所在国家或地区要求居民/公民需超过 13 周岁才能同意您的个人数据处理，您也已达到该年龄，无需我们获取母父或法定监护人的书面许可。我们仅会使用您提交的电子邮箱地址发送邀请，并处理/管理您的账户激活。请在阅读并同意我们的${tosLink.outerHTML}（包括${contentLink.outerHTML}和${privacyLink.outerHTML}）后再申请邀请。`;
			}
		}

		const h3 = mainDiv.querySelector('h3.heading');
		if (h3 && h3.textContent.trim() === 'Request an invitation') {
			h3.textContent = '申请邀请';
		}

		const newRequestForm = mainDiv.querySelector('form#new_invite_request');
		if (newRequestForm) {
			const label = newRequestForm.querySelector('label[for="invite_request_email"]');
			if (label) {
				label.textContent = '电子邮箱';
			}
			const submitButton = newRequestForm.querySelector('input[type="submit"]');
			if (submitButton) {
				submitButton.value = '添加到列表';
			}
		}

		const listInfoP = Array.from(mainDiv.querySelectorAll('p')).find(p => p.textContent.includes('check your position on the waiting list'));
		if (listInfoP) {
			const statusLink = listInfoP.querySelector('a');
			if (statusLink) {
				statusLink.textContent = '查看自己在等待名单中的位置';
				const originalText = listInfoP.textContent;
				const peopleCountMatch = originalText.match(/currently ([\d,]+) people/);
				const peopleCount = peopleCountMatch ? peopleCountMatch[1] : 'some';
				const sendingCountMatch = originalText.match(/sending out ([\d,]+) invitations/);
				const sendingCount = sendingCountMatch ? sendingCountMatch[1] : 'some';
				const hoursMatch = originalText.match(/every ([\d]+) hours/);
				const hours = hoursMatch ? hoursMatch[1] : 'some';
				listInfoP.innerHTML = `如果您已提交邀请请求，可${statusLink.outerHTML}。目前等待名单上有 ${peopleCount} 人。我们每 ${hours} 小时发送 ${sendingCount} 份邀请。`;
			}
		}

		const statusP = Array.from(mainDiv.querySelectorAll('p')).find(p => p.textContent.includes('people on the waiting list'));
		if (statusP) {
			const originalText = statusP.textContent;
			const match = originalText.match(/There are currently ([\d,]+) people on the waiting list\.\s*We are sending out ([\d,]+) invitations every ([\d,]+) hours\./);
			if (match) {
				statusP.textContent = `当前等待名单上有 ${match[1]} 人。我们每 ${match[3]} 小时发送 ${match[2]} 个邀请。`;
			}
		}

		const statusForm = mainDiv.querySelector('form[action="/invite_requests/show"]');
		if (statusForm) {
			const label = statusForm.querySelector('label[for="email"]');
			if (label) {
				label.textContent = '电子邮箱';
			}
			const submitButton = statusForm.querySelector('input[type="submit"][value="Look me up"]');
			if (submitButton) {
				submitButton.value = '查找';
			}
		}
		mainDiv.setAttribute('data-translated-by-custom-function', 'true');
	}

	if (statusHasContent) {
		const statusH2 = inviteStatusDiv.querySelector('h2.heading');
		if (statusH2 && !statusH2.hasAttribute('data-translated-by-custom-function')) {
			const match = statusH2.textContent.match(/Invitation Status for\s+(.+)/);
			if (match && match[1]) {
				statusH2.textContent = `${match[1].trim()} 的邀请状态`;
				statusH2.setAttribute('data-translated-by-custom-function', 'true');
			}
		}

		const statusH3 = inviteStatusDiv.querySelector('h3.heading');
		if (statusH3 && !statusH3.hasAttribute('data-translated-by-custom-function')) {
			const match = statusH3.textContent.match(/Invitation Status for\s+(.+)/);
			if (match && match[1]) {
				statusH3.textContent = `${match[1].trim()} 的邀请状态`;
				statusH3.setAttribute('data-translated-by-custom-function', 'true');
			}
		}

		const paragraphs = inviteStatusDiv.querySelectorAll('p');
		paragraphs.forEach(p => {
			if (p.hasAttribute('data-translated-by-custom-function')) return;
			const text = p.textContent.trim();

			const sentMatch = text.match(/Your invitation was emailed to this address on\s+([\d-]+)\.\s*If you can't find it, please check your email spam folder as your spam filters may have placed it there\./);
			if (sentMatch) {
				p.textContent = `您的邀请已于 ${sentMatch[1]} 发送至此邮箱地址。如果您无法找到它，请检查您的垃圾邮件文件夹，因为它可能被误判为垃圾邮件。`;
				p.setAttribute('data-translated-by-custom-function', 'true');
				return;
			}

			if (text.includes('Because your invitation was sent more than 24 hours ago, you can have your invitation resent.')) {
				p.textContent = '由于您的邀请已发送超过 24 小时，您可以申请重新发送。';
				p.setAttribute('data-translated-by-custom-function', 'true');
				return;
			}

			const resentMatch = text.match(/Your invitation was emailed to this address on\s+([\d-]+)\s+and resent on\s+([\d-]+)\.\s*If you can't find it/);
			if (resentMatch) {
				p.textContent = `您的邀请已于 ${resentMatch[1]} 发送至此邮箱地址，并于 ${resentMatch[2]} 重新发送。如果您无法找到它，请检查您的垃圾邮件文件夹，因为它可能被误判为垃圾邮件。`;
				p.setAttribute('data-translated-by-custom-function', 'true');
				return;
			}

			if (text.includes('If it has been more than 24 hours since you should have received your invitation')) {
				p.textContent = '如果距离您应该收到邀请的时间已超过 24 小时，且检查垃圾邮件文件夹后仍未找到，您可以访问此页面重新发送邀请。';
				p.setAttribute('data-translated-by-custom-function', 'true');
				return;
			}
		});

		const resendBtn = inviteStatusDiv.querySelector('form button[type="submit"]');
		if (resendBtn && resendBtn.textContent.trim() === 'Resend Invitation') {
			resendBtn.textContent = '重新发送邀请';
		}

		const statusResultP = inviteStatusDiv.querySelector('p');
		if (statusResultP && !statusResultP.hasAttribute('data-translated-by-custom-function')) {
			const match = statusResultP.innerHTML.match(/You are currently number <strong>([\d,]+)<\/strong> on our waiting list!\s*At our current rate, you should receive an invitation on or around:\s*(.+)\./s);
			if (match) {
				const englishDate = match[2].trim();
				const translatedDate = translateEnglishDate(englishDate);
				statusResultP.innerHTML = `您目前在等待名单上的位置是第 <strong>${match[1]}</strong> 位！按照当前速度，您应在 ${translatedDate} 前后收到邀请。`;
				statusResultP.setAttribute('data-translated-by-custom-function', 'true');
			} else if (/Sorry, we can't find the email address you entered/.test(statusResultP.textContent)) {
				statusResultP.textContent = '抱歉，我们无法找到您输入的电子邮箱地址。';
				statusResultP.setAttribute('data-translated-by-custom-function', 'true');
			}
		}
	}

	const successNotice = mainDiv.querySelector('div.flash.notice');
	if (successNotice && successNotice.textContent.includes("You've been added to our queue!")) {
		const match = successNotice.innerHTML.match(/around (.+?)\. We strongly recommend/);
		if (match && match[1]) {
			const englishDate = match[1];
			const translatedDate = translateEnglishDate(englishDate);
			successNotice.innerHTML = `您已进入排队列表！我们预计您将在 ${translatedDate} 前后收到邀请。我们强烈建议您将 do-not-reply@archiveofourown.org 添加到您的通讯录，以防邀请邮件被您的邮件服务商误判为垃圾邮件。`;
		}
	}

	const errorDiv = mainDiv.querySelector('div#error.error');
	if (errorDiv) {
		const errorH4 = errorDiv.querySelector('h4');
		if (errorH4) {
			errorH4.textContent = '抱歉！我们无法保存此邀请请求，因为：';
		}

		const errorMessages = {
			"Email can't be blank": "电子邮箱 不能为空。",
			"Email should look like an email address.": "电子邮箱 格式不正确。",
			"Email is already being used by an account holder.": "该电子邮箱地址已被其她账户使用。",
		};

		const errorLis = errorDiv.querySelectorAll('ul li');
		errorLis.forEach(li => {
			const originalError = li.textContent.trim();
			if (errorMessages[originalError]) {
				li.textContent = errorMessages[originalError];
			}
		});
	}
}

/**
 * 专用翻译函数：翻译“请求过于频繁”的错误页面
 */
function translateTooManyRequestsPage() {
	const body = document.body;
	if (body.hasAttribute('data-translated-by-custom-function')) {
		return;
	}
	document.title = "请求过于频繁！ | AO3 作品库";
	const headerH1 = document.querySelector('header h1');
	if (headerH1) {
		headerH1.innerHTML = 'AO3 作品库 <sup>beta</sup>';
	}

	const mainH2 = document.querySelector('main h2');
	if (mainH2) {
		const logoImg = mainH2.querySelector('img.logo');
		if (logoImg) {
			mainH2.innerHTML = `${logoImg.outerHTML} 请求页面过于频繁。`;
		}
	}

	const paragraphs = document.querySelectorAll('main p');
	if (paragraphs.length >= 2) {
		paragraphs[0].textContent = '我们已阻止此操作以保护系统安全。请一次加载较少页面或放慢浏览速度，并在几分钟后重试。';

		const supportLink = paragraphs[1].querySelector('a');
		if (supportLink) {
			supportLink.textContent = '联系支持团队';
			paragraphs[1].innerHTML = `如果问题依旧存在，请 ${supportLink.outerHTML} 。`;
		}
	}

	const footerSmall = document.querySelector('footer small');
	if (footerSmall) {
		const bTags = footerSmall.querySelectorAll('b');
		if (bTags.length === 2) {
			bTags[0].textContent = 'Ray ID：';
			bTags[1].textContent = '您的 IP：';
		}
		const showIpLink = footerSmall.querySelector('#client-ip-reveal');
		if (showIpLink) {
			showIpLink.textContent = '显示 IP';
		}
	}
	body.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专门用于翻译 /works/search 页面上的“作品搜索”帮助文本。
 */
function translateWorkSearchTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search text help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：任意字段</h4>
            <p>搜索数据库中与作品相关的所有字段，包括简介、注释和标签，但不包括作品全文。</p>
            <p>字符“:”和“@”具有特殊含义。请不要在搜索中使用它们，否则会得到意想不到的结果。就像在“标题”和“作者/画师”字段中，您可以使用以下运算符来组合搜索词：</p>
            <dl>
                <dt>*: 匹配任意字符</dt>
                <dd><kbd>book*</kbd> 将匹配 <samp>book</samp>、<samp>books</samp> 和 <samp>booking</samp>。</dd>
                <dt>空格：在同一字段中，相当于 AND 操作</dt>
                <dd><kbd>Harry Potter</kbd> 会匹配任何字段中包含 “<samp>Harry Potter</samp>” 或 “<samp>Harry James Potter</samp>” 的作品，但不会匹配创作者名为 <samp>Harry</samp> 且角色标签为 <samp>Sherman Potter</samp> 的作品。</dd>
                <dt>AND：在任何字段中同时包含这两个词的作品</dt>
                <dd><kbd>Harry AND Potter</kbd> 会匹配创作者名为 <samp>Harry</samp> 且角色标签为 <samp>Sherman Potter</samp> 的作品。</dd>
                <dt>||: OR（非排她性）</dt>
                <dd><kbd>Harry || Potter</kbd> 会匹配 <samp>Harry</samp>、<samp>Harry Potter</samp> 和 <samp>Potter</samp>。</dd>
                <dt>"": 精确匹配词组</dt>
                <dd><kbd>"Harry Lockhart"</kbd> 会匹配 <samp>Harry Lockhart</samp>，但不会匹配 <samp>Harry Potter/Gilderoy Lockhart</samp>。</dd>
                <dt>-: NOT（排除）</dt>
                <dd><kbd>Harry -Lockhart</kbd> 会匹配 <samp>Harry Potter</samp>，但不会匹配 <samp>Harry Lockhart</samp> 或 <samp>Gilderoy Lockhart/Harry Potter</samp>。</dd>
            </dl>
            <h5>示例</h5>
            <dl>
                <dt><kbd>"Fandom X" "F/F" -Explicit</kbd></dt>
                <dd>会匹配出所有标记为 女/女 的 同人圈 X 的作品，并排除标记为 限制级 的作品。</dd>
                <dt><kbd>"Character A" OR "Character B" -"Character Death"</kbd></dt>
                <dd>会匹配出包含 Character A 或 Character B（或两者皆有）的所有作品，并排除在预警或附加标签中标记有 “角色死亡” 的作品。</dd>
                <dt><kbd>"Character A/Character B" "Underage Sex" (Mature OR Explicit)</kbd></dt>
                <dd>会匹配出所有包含 未成年性行为 预警且分级为 成人向 或 限制级的该配对作品。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品搜索：文本 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /works/search 页面上“日期”相关的帮助文本框。
 */
function translateWorkSearchDateTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search date help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：日期</h4>
            <p>创建一个时间范围。如果未提供范围，将根据指定的时间段自动计算。</p>
            <p>可用时间段：year, month, week, day, hour（年、月、周、天、小时）</p>
            <ul>
                <li>x days ago：从该天开始到结束的 24 小时区间</li>
                <li>x weeks ago：从该周周一开始到周日结束的 7 天区间</li>
                <li>x months ago：从该月第一天开始到最后一天结束的 1 个月区间</li>
                <li>x years ago：从该年年初开始到年末结束的 1 年区间</li>
            </ul>
            <p>示例（以 2012 年 4 月 25 日 星期三 为当前日期）：</p>
            <ul>
                <li>7 days ago：匹配出 2012 年 4 月 18 日当天发布或更新的所有作品</li>
                <li>1 week ago：匹配出 2012 年 4 月 16 日（周一）至 4 月 22 日（周日）这一周内发布或更新的所有作品</li>
                <li>2 months ago：匹配出 2012 年 2 月内发布或更新的所有作品</li>
                <li>3 years ago：匹配出 2010 年内发布或更新的所有作品</li>
                <li>< 7 days：匹配出过去七天内发布或更新的所有作品</li>
                <li>> 8 weeks：匹配出八周之前发布或更新的所有作品</li>
                <li>13-21 months：匹配出十三到二十一个月之前发布或更新的所有作品</li>
            </ul>
            <p>请注意，“ago”（之前/前）一词是可选的。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品搜索：日期 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /works/search 页面上“跨圈作品”相关的帮助文本框。
 */
function translateWorkSearchCrossoverTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search crossover help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：跨圈作品</h4>
            <p>
                一般来说，<a href="https://fanlore.org/wiki/Crossover">跨圈作品</a>指包含多个同人圈的作品。在筛选时，如果一篇作品被标注为两个或更多<em> 不相关的 </em>同人圈，就被视为跨圈作品（我们使用标签整理系统来做出此判定）。
            </p>
            <p>
                想要查找两个特定同人圈之间的跨圈作品？请在搜索表单中的“同人圈”字段输入它们的名称，或在筛选器中选择/输入这两个同人圈。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '搜索：跨圈作品 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /works/search 页面上“数值”相关的帮助文本框。
 */
function translateWorkSearchNumericalTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search numerical help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：数值</h4>
            <p>在查找具有特定字数、点击量、点赞数、评论或书签数量的作品时，请使用以下指南。注意句号和逗号会被忽略：1.000 = 1,000 = 1000。</p>
            <dl>
                <dt>10</dt>
                <dd>单个数字将查找具有该确切数值的作品。</dd>
                <dt><100</dt>
                <dd>查找数值小于该数的作品。</dd>
                <dt>>100</dt>
                <dd>查找数值大于该数的作品。</dd>
                <dt>100–1000</dt>
                <dd>查找数值在 100 到 1000 范围内的作品。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品搜索：数值 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /works/search 页面上“语言”相关的帮助文本框。
 */
function translateWorkSearchLanguageTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search language help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：语言</h4>
            <p>从此下拉菜单中选择一种语言即可搜索该语言的作品。请注意，此列表包含我们当前支持的所有语言，并非所有选项都能返回结果。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品搜索：语言 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /works/search 页面上“标签”相关的帮助文本框。
 */
function translateWorkSearchTagsTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search tags help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：标签</h4>
            <p>
                “同人圈”、“角色”、“关系”以及“附加标签”字段在输入搜索词时会提供标签建议。选择“规范”或常用标签（即自动补全列表中出现的标签）将匹配出所有包含该标签、本标签的同义标签以及与之关联的子标签的结果。例如，选中规范关系标签 <samp>Erika Mustermann/Juan Pérez</samp> 后，系统也会匹配出被标注为 <samp>Juan Pérez/Erika Mustermann</samp> 的作品，前提是这些标签已由标签管理员在后台关联完成。更多信息可参阅<a href="/faq/tags#whatcanonical">“什么是‘规范’标签？”</a>。
            </p>
            <p>
                如果某个标签未出现在自动补全列表中，并不代表该标签在 Archive 中不存在；它可能仅尚未被标签管理员标记为常用标签。您可以在此字段输入任意词语或短语。如果您的短语未精确匹配某个常用标签，搜索则会检索所有包含该短语中词语的标签。例如，输入 <kbd>People Doing Things</kbd> 同时也会匹配 <samp>Nice People Doing Things</samp>、<samp>People Doing Shady Things</samp> 和 <samp>People Doing Things with Spoons</samp> 等标签。但在这种情况下，搜索结果可能会比较不可预测。
            </p>
            <p>
                输入的搜索词越多、选项越多，搜索结果就越精确。默认情况下，所有搜索条件之间是 AND 关系：输入两个同人圈时，只会匹配出同时包含这两个同人圈标签的作品，而不是两个同人圈<em>任意一个</em>的所有作品；同理，输入两个角色时，只会匹配出同时包含这两个角色的作品；同时选中 <samp>女/男</samp> 和 <samp>男/男</samp> 关系标签，则仅会匹配出同时包含这两种关系标签的作品，依此类推。
            </p>
            <p>
                更多关于标签的内容请参阅我们的<a href="/faq/tags">标签常见问题（Tags FAQ）</a>，更多关于标签搜索的说明请参阅<a href="/faq/search-and-browse/">搜索与浏览常见问题（Search and Browse FAQ）</a>。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品搜索：标签 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /people/search 页面上“用户搜索”相关的帮助文本框。
 */
function translatePeopleSearchTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'People search all fields') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>用户搜索：搜索所有字段</h4>
            <p>
                在“搜索所有字段”中输入文本，以查找用户名、笔名或笔名描述中包含搜索词的用户。
            </p>
            <p>
                字符“:”和“@”具有特殊含义。请不要在搜索中使用它们，否则会得到意想不到的结果。
            </p>
            <dl>
                <dt>*: 匹配任意字符</dt>
                <dd><kbd>User*</kbd> 将匹配 <samp>User</samp>、<samp>Users</samp> 和 <samp>Username </samp>。</dd>
                <dt>空格: 相当于 AND</dt>
                <dd><kbd>A. User</kbd> 将匹配 <samp>A. User</samp> 和 <samp>A. Test User</samp>，但不会匹配 <samp>User </samp>。</dd>
                <dt>|: OR (非排她性)</dt>
                <dd><kbd>A. | User</kbd> 将匹配 <samp>A.</samp>、<samp>A. User</samp> 和 <samp>User </samp>。</dd>
                <dt>"": 精确匹配词组</dt>
                <dd><kbd>"A. User"</kbd> 将匹配 <samp>"A. User"</samp>，但不会匹配 <samp>A. Test User </samp>。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '用户搜索：所有字段 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“文本”相关的帮助文本框。
 */
function translateBookmarkSearchTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search text help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：文本</h4>
            <p>使用以下指南输入搜索词和搜索运算符。“任意字段”会组合搜索表单中的所有文本字段（包括标签）。“书签创建者”可让您搜索由特定用户创建的书签。“注释”会在所有书签创建者的注释中搜索词条。</p>
            <p>字符“:”和“@”具有特殊含义。请不要在搜索中使用它们，否则会得到意想不到的结果。</p>
            <dl>
                <dt>*: 匹配任意字符</dt>
                <dd><kbd>book*</kbd> 会匹配 <samp>book</samp>、<samp>books</samp> 和 <samp>booking</samp>。</dd>
                <dt>空格: 相当于 AND</dt>
                <dd><kbd>Harry Potter</kbd> 会匹配 <samp>Harry Potter</samp> 和 <samp>Harry James Potter</samp>，但不会匹配 <samp>Harry</samp>。</dd>
                <dt>||: OR (非排她性)</dt>
                <dd><kbd>Harry || Potter</kbd> 会匹配 <samp>Harry</samp>、<samp>Harry Potter</samp> 和 <samp>Potter</samp>。</dd>
                <dt>"": 精确匹配词组</dt>
                <dd><kbd>"Harry Lockhart"</kbd> 会匹配 <samp>Harry Lockhart</samp>，但不会匹配 <samp>Harry Potter/Gilderoy Lockhart</samp>。</dd>
                <dt>-: NOT (排除)</dt>
                <dd><kbd>Harry -Lockhart</kbd> 会匹配 <samp>Harry Potter</samp>，但不会匹配 <samp>Harry Lockhart</samp> 或 <samp>Gilderoy Lockhart/Harry Potter</samp>。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：文本 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“作品标签”相关的帮助文本框。
 */
function translateBookmarkSearchWorkTagsTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search work tag') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：作品标签</h4>
            <p>
                “作品标签”字段会搜索条目创建者为已创建书签作品添加的所有标签，不包括书签创建者自己添加的标签。标签类型可为：分级、预警、分类、同人圈、角色、关系、附加标签。该字段在您输入搜索关键词时会建议规范标签。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：作品标签 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“类型”相关的帮助文本框。
 */
function translateBookmarkSearchTypeTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search type help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：类型</h4>
            <p>
                选择已创建书签条目的类型，以将搜索结果限制为“作品”、“系列”或“外部作品”。请注意，选择“外部作品”时，将匹配出所有托管于 Archive 之外的作品的书签。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：类型 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“更新日期”相关的帮助文本框。
 */
function translateBookmarkSearchDateUpdatedTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search date updated help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：更新日期</h4>
            <p>指定一个时间范围，以查找在该时间段内发布或更新的已创建书签条目，例如有新章节的作品或有新作品的系列。如果作品被创作者自定义发布日期（即上传时设置了与实际上传日期不同的发布日期），则该自定义发布日期将用于本次搜索。</p>
            <p>您可以按 year, month, week, day, hour（年、月、周、天或小时）进行搜索。</p>
            <h5>示例：</h5>
            <dl>
                <dt>< 3 days ago</dt>
                <dd>查找过去 3 天内发布或更新的书签条目。</dd>
                <dt>> 3 years ago</dt>
                <dd>查找 3 年之前发布或更新的书签条目。</dd>
                <dt>3-9 months ago</dt>
                <dd>查找 3 到 9 个月前发布或更新的书签条目。</dd>
            </dl>
            <p>“ago”（之前/前）一词是可选的。请注意，“ 1 天前”并不是一个范围，只会查找恰好在昨天此时更新的条目。如有需要，应当创建一个区间来搜索。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：更新日期 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“书签创建者的标签”相关的帮助文本框。
 */
function translateBookmarkSearchBookmarkerTagsTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search bookmarker tag') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：书签创建者标签</h4>
            <p>
                “书签创建者的标签”字段会搜索书签创建者为该书签添加的所有标签，不包括作品或系列本身的标签。标签类型可为：分级、预警、分类、同人圈、角色、关系、附加标签。该字段在您输入搜索词时会建议规范标签。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：书签创建者标签 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“推荐”相关的帮助文本框。
 */
function translateBookmarkSearchRecTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search rec help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：推荐</h4>
            <p>
                选择此选项可将搜索范围限定为书签创建者标记为“推荐”的书签。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：推荐 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“含注释”相关的帮助文本框。
 */
function translateBookmarkSearchNotesTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search notes help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：含注释</h4>
            <p>
                选择此选项可将搜索范围限定为带有书签创建者添加注释的书签。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：注释 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“添加日期”相关的帮助文本框。
 */
function translateBookmarkSearchDateBookmarkedTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark search date bookmarked help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>书签搜索：添加日期</h4>
            <p>指定一个时间范围，以查找在该时间段内创建的书签。这可能与已创建书签条目的发布或更新时间不同。</p>
            <p>您可以按 year, month, week, day, hour（年、月、周、天或小时）进行搜索。</p>
            <h5>示例：</h5>
            <dl>
                <dt>< 3 days ago</dt>
                <dd>查找过去 3 天内创建的书签。</dd>
                <dt>> 3 years ago</dt>
                <dd>查找 3 年之前创建的书签。</dd>
                <dt>3-9 months ago</dt>
                <dd>查找 3 到 9 个月前创建的书签。</dd>
            </dl>
            <p>“ago”（之前/前）一词是可选的。请注意，“ 1 天前”并不是一个范围，只会查找恰好在昨天此时创建的书签。如有需要，应当创建一个区间来搜索。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签搜索：添加日期 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /tags/search 页面上“文本搜索”相关的帮助文本框。
 */
function translateTagSearchTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Tag search text help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>标签搜索：文本</h4>
            <dl>
                <dt>*: 匹配任意字符</dt>
                <dd><kbd>book*</kbd> 会匹配 <samp>book</samp>、<samp>books</samp> 和 <samp>booking</samp>。</dd>
                <dt>空格: 相当于 AND</dt>
                <dd><kbd>Harry Potter</kbd> 会匹配 <samp>Harry Potter</samp> 和 <samp>Harry James Potter</samp>，但不会匹配 <samp>Harry</samp>。</dd>
                <dt>||: OR (非排她性)</dt>
                <dd><kbd>Harry || Potter</kbd> 会匹配 <samp>Harry</samp>、<samp>Harry Potter</samp> 和 <samp>Potter</samp>。</dd>
                <dt>"": 精确匹配词组</dt>
                <dd><kbd>"Harry Lockhart"</kbd> 会匹配 <samp>Harry Lockhart</samp>，但不会匹配 <samp>Harry Potter/Gilderoy Lockhart</samp>。</dd>
                <dt>NOT: 排除</dt>
                <dd><kbd>Harry NOT Lockhart</kbd> 会匹配 <samp>Harry Potter</samp>，但不会匹配 <samp>Harry Lockhart</samp> 或 <samp>Gilderoy Lockhart/Harry Potter</samp>。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '标签搜索：文本 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用翻译函数：翻译“图标说明”弹窗
 */
function translateSymbolsKeyModal() {
	const footerTitle = document.querySelector('#modal div.footer span.title');
	if (!footerTitle || footerTitle.textContent !== 'Symbols key') {
		return;
	}
	const modal = footerTitle.closest('#modal');
	if (!modal) {
		return;
	}
	const mainTitle = modal.querySelector('div.content.userstuff > h4');
	if (mainTitle) {
		mainTitle.textContent = '在 AO3 上使用的图标';
	}
	const sections = modal.querySelectorAll('#symbols-key > dd');
	if (sections.length === 4) {
		const ratingDefs = sections[0].querySelectorAll('dl > dd');
		if (sections[0].querySelector('h4')) sections[0].querySelector('h4').textContent = '内容分级';
		if (ratingDefs.length === 5) {
			ratingDefs[0].textContent = '全年龄';
			ratingDefs[1].textContent = '青少年及以上';
			ratingDefs[2].textContent = '成人向';
			ratingDefs[3].textContent = '限制级：仅适合成年人';
			ratingDefs[4].textContent = '该作品未设定任何分级';
		}
		const relDefs = sections[1].querySelectorAll('dl > dd');
		if (sections[1].querySelector('h4')) sections[1].querySelector('h4').textContent = '关系、配对与性向';
		if (relDefs.length === 7) {
			relDefs[0].textContent = '女/女：女性/女性配对';
			relDefs[1].textContent = '女/男：女性/男性配对';
			relDefs[2].innerHTML = '无CP：无恋爱关系或性关系, 或者恋爱关系并非作品重点';
			relDefs[3].textContent = '男/男：男性/男性配对';
			relDefs[4].innerHTML = '多配对：含有一种以上的配对，或者含有数个伴侣的配对';
			relDefs[5].textContent = '其她关系';
			relDefs[6].textContent = '该作品未被归入任何分类';
		}
		const warnDefs = sections[2].querySelectorAll('dl > dd');
		if (sections[2].querySelector('h4')) sections[2].querySelector('h4').textContent = '内容预警';
		if (warnDefs.length === 4) {
			warnDefs[0].innerHTML = '作者选择不标注预警，或 Archive 预警<em>可能 </em>适用，但作者未具体说明。';
			warnDefs[1].innerHTML = '至少包含以下预警之一：暴力场景描写、主要角色死亡、强暴/<acronym title="非自愿性行为">非自愿性行为</acronym>、未成年性爱。具体预警请参阅 Archive 预警标签。';
			warnDefs[2].innerHTML = '该作品未标注任何 Archive 预警。请注意，作者可能在“附加标签”（类型、预警、其她信息）部分提供了有关作品的其她信息。';
			warnDefs[3].innerHTML = '这是外部作品；请查看该作品本身以获知预警。';
		}
		const statusDefs = sections[3].querySelectorAll('dl > dd');
		if (sections[3].querySelector('h4')) sections[3].querySelector('h4').textContent = '作品是否完结或同人梗是否实现？';
		if (statusDefs.length === 3) {
			statusDefs[0].textContent = '该作品正在连载或尚未完成/同人梗尚未实现。';
			statusDefs[1].textContent = '该作品已完结/该同人梗已实现！';
			statusDefs[2].textContent = '该作品状态未知。';
		}
	}
	footerTitle.textContent = '图标说明';
	const closeButton = modal.querySelector('div.footer a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
	modal.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专门用于翻译“富文本”帮助弹窗。
 */
function translateRteHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Rte help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h2>富文本</h2>
            <p>富文本编辑器（<abbr title="富文本编辑器">RTE</abbr>）的具体行为取决于您的设备、浏览器、操作系统以及您粘贴内容的来源。但是，从一个格式规范的文档开始，将有助于您最大程度地利用 <abbr>RTE</abbr> 。以下是一些通用技巧，以确保您的格式尽可能被保留：</p>
            <ul>
                <li><p><strong>在段落之间按<em>一次</em> <kbd>Enter</kbd> 键。</strong>按两次 <kbd>Enter</kbd> 会插入一个空段落，当您粘贴到 <abbr>RTE</abbr> 时，会在段落之间产生额外的、可能不需要的空格。Archive 使用顶部和底部边距来制造段落间的空行效果；您可以使用文本编辑器中的段落格式选项来达到类似效果，而无需添加额外的 <code>&lt;p&gt;</code> 标签。</p></li>
                <li><p><strong>为标题、块引用、代码等使用预设样式。</strong>通常在文本编辑器的 “格式” 菜单中找到的 “样式” 选项，在粘贴到 <abbr>RTE</abbr> 时通常会转换为 <abbr title="超文本标记语言">HTML</abbr> 标签。仅仅通过改变字体大小、字体名称或文本缩进来模拟标题或块引用的视觉效果，通常是不会起作用的。</p></li>
            </ul>
            <h3>从特定文本编辑器粘贴</h3>
            <h4>Google Drive</h4>
            <p>Google Drive 使用内联 <abbr title="层叠样式表">CSS</abbr> 来改变文本对齐方式以及产生粗体、斜体、下划线和删除线格式。遗憾的是，我们不允许在 Archive 上使用内联样式，因此只有纯 <abbr>HTML</abbr> 格式（如标题、列表、链接和表格）会被保留。</p>
            <p>在某些浏览器中，格式在粘贴到 <abbr>RTE</abbr> 时可能看起来被保留了，但在预览或发布您的作品时，它将被我们的 <abbr>HTML</abbr> 清理程序移除。</p>
            <h4>Scrivener</h4>
            <p>Scrivener 用户通常通过粘贴到 <abbr>HTML</abbr> 编辑器，然后切换到 <abbr>RTE</abbr> 进行修改，可以获得更好的效果。要从 Scrivener 复制 HTML，请执行以下操作：</p>
            <ol>
                <li>转到 “编辑” 菜单</li>
                <li>选择 “特殊复制”</li>
                <li>选择 “以 HTML 格式复制” 或 “以 HTML 格式复制（基础，使用 &lt;p&gt; 和 &lt;span&gt;）”</li>
            </ol>
            <h3>粘贴特定类型的格式</h3>
            <h4>下划线和删除线</h4>
            <p>下划线和删除线通常由 <abbr>CSS</abbr> 产生。因为 Archive 不允许使用内联 <abbr>CSS</abbr>，这些文本样式在粘贴时经常会丢失。</p>
            <p>从使用 <code>&lt;u&gt;</code>、<code>&lt;del&gt;</code>、<code>&lt;strike&gt;</code> 或 <code>&lt;s&gt;</code> 标签的网页粘贴将可以正常工作。</p>
            <h4>对齐</h4>
            <p>文本对齐现在通常通过 <abbr>CSS</abbr> 实现，并且因为 Archive 不允许内联 <abbr>CSS</abbr>，对齐方式在粘贴时通常会丢失。</p>
            <p>从使用 <code>align</code> 属性和 <code>&lt;center&gt;</code> 元素的来源粘贴将保持格式完整，但请注意，<abbr>RTE</abbr> 中的对齐按钮无法修改用 <code>&lt;center&gt;</code> 标签创建的居中对齐。</p>
            <h4>标题</h4>
            <p>文本编辑器为其标题预设使用许多不同的样式。例如，在 OpenOffice 中选择 “标题 4” 会产生斜体的无衬线文本。即使成功将标题粘贴到 <abbr>RTE</abbr> 中，这种视觉格式也<em>不会</em>被保留——只有 <code>&lt;h4&gt;</code> 标签会被保留。这不是 bug 。<abbr>HTML</abbr> 旨在告诉浏览器文本的含义（例如：“这是一个标题” ），而不是它应该如何显示（例如：“这应该是 Arial 字体” ）。如果您希望修改标题或作品任何其她部分的样式，请使用作品界面。</p>
            <h4>缩进文本</h4>
            <p>缩进文本是一种纯粹的视觉效果，没有等效的 <abbr>HTML</abbr>，并且不会被保留。请使用作品界面来缩进文本。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '富文本 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用翻译函数：翻译“HTML帮助”弹窗
 */
function translateHtmlHelpModal() {
	const modal = document.querySelector('#modal');
	if (!modal) return;
	const h2 = modal.querySelector('h2');
	if (!h2 || !h2.textContent.includes('HTML on the Archive')) {
		return;
	}
	const contentDiv = modal.querySelector('.content.userstuff');
	if (!contentDiv) return;
	contentDiv.innerHTML = `
        <h2>Archive 上的 HTML</h2>
        <h3>允许的 HTML</h3>
        <p>
            <code>a, abbr, acronym, address, [align], [alt], [axis], b, big, blockquote, br, caption, center, cite, [class], code, col, colgroup, dd, del, details, dfn, div, dl, dt, em, figcaption, figure, h1, h2, h3, h4, h5, h6, [height], hr, [href], i, img, ins, kbd, li, [name], ol, p, pre, q, rp, rt, ruby, s, samp, small, span, [src], strike, strong, sub, summary, sup, table, tbody, td, tfoot, th, thead, [title], tr, tt, u, ul, var, [width]</code>
        </p>
        <h3>我们如何格式化您的 HTML？</h3>
        <p>当您在 Archive 上输入 HTML 时，我们会对其进行清理，以确保安全（防止垃圾邮件发送者和黑客上传恶意内容），并为方便您和提高可访问性做一些基本格式化。我们采取的格式化步骤如下：</p>
        <ul>
            <li>如果您在两段文字间留有空行，我们会为您自动在这两段文字外加上 &lt;p&gt; 段落标签。</li>
            <li>如果您在两行文字间只有一个换行符，我们会为您插入 &lt;br /&gt; 换行标签。</li>
            <li>如果您连续使用两个换行标签（&lt;br /&gt;&lt;br /&gt;）且中间没有内容，我们会将其转换为段落标签。</li>
            <li>如果您连续留有两个空行，我们会为您插入额外的空白（使用 &lt;p&gt;&nbsp;&lt;/p&gt;）。</li>
            <li>如果您有错误嵌套的标签，例如：&lt;em&gt;&lt;strong&gt;<em><strong>text!</em></strong>&lt;/em&gt;&lt;/strong&gt; ，我们会自动修正嵌套顺序（调整为：&lt;em&gt;&lt;strong&gt;<em><strong>text!</em></strong>&lt;/strong&gt;&lt;/em&gt; ）。</li>
            <li>如果您忘记关闭某个格式化标签，该标签会在段落末尾自动关闭。</li>
            <li>如果您在一段中打开了格式化标签但在几段之后才关闭，我们会在每个段落内重新打开并关闭该标签。</li>
            <li>如果您插入了自定义 HTML（例如在 &lt;ul&gt; 中的项目列表），且不希望我们自动插入换行或段落标签，只需将所有内容写在同一行即可（这是为了自动段落/换行标签与自定义 HTML 兼容所做的不便折衷）。</li>
            <li>如果某段文字显示得比其她文字大，可能是我们的格式化程序无法识别段落边界。您可以手动为该段文字添加段落标签来修复。</li>
        </ul>
        <p class="note">当您第一次输入 HTML 后再次编辑时，您将看到我们格式化的结果，以便纠正任何我们的格式化程序可能造成的错误。请注意，获得良好效果的最佳方式是输入规范的 HTML——这样您的作品在各浏览器、屏幕阅读器、移动设备和下载时都会正确显示。</p>
        <p class="note">“良好 HTML” 意味着能准确标注文本含义的 HTML——如果是段落，应使用段落标签，而不仅仅是使用换行标签分隔。如果是强调文字，应使用 &lt;em&gt; 标签。如果是项目列表，每个项目都应放在列表标签内。如果&lt;em&gt;不是&lt;/em&gt;一个项目列表，您就不应该使用列表标签。:)</p>
        <p class="note">如果您发现自己为了达到某种视觉效果而输入了不符合语义的 HTML，请尽量避免！“作品界面”功能允许您对作品应用自定义 CSS，让它们呈现您想要的任何样式（前提是从“良好 HTML”开始会更容易）。</p>
        <p>一些具体建议：</p>
        <dl id="help">
            <dt>标题，使用标题标签： <code>h1、h2、h3、h4、h5、h6</code></dt>
            <dd id="headings">
            <ul>
                <li><h1>&lt;h1&gt;标题&lt;h1&gt;<h1></li>
                <li><h2>&lt;h2&gt;副标题&lt;h2&gt;<h2></li>
                <li><h3>&lt;h3&gt;章节标题&lt;h3&gt;</li>
                <li><h4>&lt;h4&gt;场景标题&lt;h4&gt;<h4></li>
                <li><h5>&lt;h5&gt;小标题&lt;h5&gt;<h5></li>
                <li><h6>&lt;h6&gt;脚注标题&lt;h6&gt;</li>
            </ul>
            </dd>
            <dt>强调，使用强调标签： <code>em、strong</code></dt>
            <dd id="emphasis">
            <ul>
                <li><p>&lt;em&gt;<em>Rodney</em>&lt;/em&gt;Mckay</p></li>
                <li><p>我 &lt;strong&gt;<strong>永远都不会</strong>&lt;/strong&gt;理解你！</p></li>
            </ul>
            </dd>
            <dt>引用诗歌、短句或书名，使用引用标签： <code>blockquote、q、cite</code></dt>
            <dd id="quotes">
            <ul>
                <li>&lt;blockquote&gt;<blockquote><p>引用一段文字</p></blockquote>&lt;/blockquote&gt;</li>
                <li><p>使用 q 来&lt;q&gt;<q>引用短句</q>&lt;/q&gt;</p></li>
                <li><p>使用 cite 来引用&lt;cite&gt;<cite>书名或文章名</cite>&lt;/cite&gt;</p></li>
            </ul>
            </dd>
        </dl>`;

	const footer = modal.querySelector('div.footer');
	if (footer) {
		footer.querySelector('.title').textContent = 'Html 帮助';
		footer.querySelector('.action').textContent = '关闭';
	}
}

/**
 * 专用翻译函数：翻译“书签搜索结果”帮助弹窗
 */
function translateBookmarkSearchResultsHelpModal() {
	const modal = document.querySelector('#modal');
	if (!modal) {
		return;
	}
	const footerTitle = modal.querySelector('.footer .title');
	if (!footerTitle || footerTitle.textContent.trim() !== 'Bookmark search results help') {
		return;
	}
	const h4 = modal.querySelector('.content.userstuff h4');
	if (h4) {
		h4.textContent = '书签搜索：结果';
	}
	const p = modal.querySelector('.content.userstuff p');
	if (p) {
		const workSearchLink = p.querySelector('a[href="/works/search"]');
		if (workSearchLink) {
			workSearchLink.textContent = '“作品搜索”';
			p.innerHTML = `结果按相关性排序。请注意，列表会包含某个作品的所有书签，因为每条书签都会单独计入结果。要搜索作品而非书签，请使用 ${workSearchLink.outerHTML} 。`;
		}
	}
	footerTitle.textContent = '书签搜索：结果 帮助';
	const closeButton = modal.querySelector('.footer a.action');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
	modal.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用翻译函数：翻译“关于标签集”弹窗
 */
function translateTagsetAboutModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Tagset about') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>关于标签集</h4>
            <p>如果您曾想在 Archive 举办挑战活动，就可以使用标签集。您可以创建一个标签集，列出所有应当出现在报名表单中的标签，即使这些标签此前在 Archive 上尚未使用过，然后将此标签集添加到您的挑战活动中。报名表单将自动显示标签集中包含的标签。</p>
            <p>您可以添加任意数量的管理员协助管理标签集（无需开放活动设置权限），还可以允许活动参与者提名要添加到标签集的新标签。您及管理员可审核这些提名，并选择批准或拒绝。您可以为标签集中的新标签添加同人圈关联，或交由标签管理员处理（这可能需要一些时间）。</p>
            <p>所有标签集均展示于“标签集主页面”，浏览它们有助于您更深入理解其运作机制。</p>
            <p>部分用户可能会选择将自己的标签集公开共享，供她人在活动中使用。请注意，标签集的所有者可以随时<strong>删除或修改标签集而不另行通知</strong>，因此在使用她人标签集举办挑战活动前，请务必确认该标签集所有者不会对其进行变更。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '关于标签集';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门翻译“标签提名”页面的提名规则说明。
 * @param {string} originalText - 匹配到的原始英文句子。
 * @returns {string} - 动态构建的中文翻译。
 */
function translateNominationRule(originalText) {
	const componentRules = {
		fandoms: {
			regex: /([\d,]+) fandoms/,
			template: "$1 个同人圈"
		},
		characters: {
			regex: /([\d,]+) characters/,
			template: "$1 个角色"
		},
		relationships: {
			regex: /([\d,]+) relationships/,
			template: "$1 对关系"
		},
		additionalTags: {
			regex: /([\d,]+) additional tags/,
			template: "$1 个附加标签"
		}
	};
	const parts = {};
	for (const key in componentRules) {
		const match = originalText.match(componentRules[key].regex);
		if (match) {
			parts[key] = match[1];
		}
	}
	if (Object.keys(parts).length === 0) {
		return originalText;
	}
	const mainClauses = [];
	const perFandomClauses = [];
	let additionalTagClause = '';
	const hasFandomContext = !!parts.fandoms || originalText.includes('for each one');
	if (parts.fandoms) {
		mainClauses.push(componentRules.fandoms.template.replace('$1', parts.fandoms));
	}
	if (!hasFandomContext) {
		if (parts.characters) mainClauses.push(componentRules.characters.template.replace('$1', parts.characters));
		if (parts.relationships) mainClauses.push(componentRules.relationships.template.replace('$1', parts.relationships));
		if (parts.additionalTags && !originalText.includes('You can also nominate')) {
			mainClauses.push(componentRules.additionalTags.template.replace('$1', parts.additionalTags));
		}
	}
	if (hasFandomContext) {
		if (parts.characters) perFandomClauses.push(componentRules.characters.template.replace('$1', parts.characters));
		if (parts.relationships) perFandomClauses.push(componentRules.relationships.template.replace('$1', parts.relationships));
	}
	if (parts.additionalTags && originalText.includes('You can also nominate')) {
		additionalTagClause = ` 您也可以最多提名 ${componentRules.additionalTags.template.replace('$1', parts.additionalTags)}。`;
	}
	let finalTranslation = '';
	if (mainClauses.length > 0) {
		finalTranslation = `您最多可提名 ${mainClauses.join('和 ')}`;
	}
	if (perFandomClauses.length > 0) {
		if (finalTranslation === '') {
			finalTranslation = `您最多可为每个同人圈提名 ${perFandomClauses.join('和 ')}。`;
		} else {
			finalTranslation += `，最多可为每个同人圈提名 ${perFandomClauses.join('和 ')}。`;
		}
	} else if (finalTranslation !== '') {
		finalTranslation += '。';
	}
	finalTranslation += additionalTagClause;
	return finalTranslation.trim() || originalText;
}

/**
 * 专用翻译函数：翻译“预警”相关的帮助文本框
 */
function translateWarningHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Warning help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>预警标签</h4>
            <p>由于法律及其她原因，AO3 要求用户必须为一组常见预警（血腥暴力描写、主要角色死亡、强暴/非自愿性行为、未成年性行为）选择是否预警。创作者可在此框架内选择不预警其中某些内容，或添加额外预警。</p>
            <dl>
                <dt>不使用 Archive 预警：</dt>
                <dd>如果您不想为任何内容添加预警，或不知道应当预警什么，或不喜欢对特定话题或预警本身进行标注，或想避免部分剧透，可选择此项。</dd>
                <dt>暴力场景描写：</dt>
                <dd>用于描述血腥、露骨的暴力场面。具体界限由您自行判断。</dd>
                <dt>主要角色死亡：</dt>
                <dd>请自行判断哪些角色属于“主要角色”。</dd>
                <dt>Archive 预警不适用：</dt>
                <dd>如果您的内容不包含血腥暴力描写、主要角色死亡、强暴/非自愿性行为或未成年性行为，请选择此项。</dd>
                <dt>强暴/非自愿性行为：</dt>
                <dd>如您认为内容可能涉及非自愿性行为，但不确定或不想使用此预警，可选择“不使用 Archive 预警”。</dd>
                <dt>未成年性行为：</dt>
                <dd>用于描述或描绘十八岁以下角色的性行为（不包括亲吻等约会行为或无具体描写的模糊提及）。此预警一般适用于人类；如涉外星人或千年吸血鬼等特殊设定，请酌情判断。您也可注明角色年龄或选择“不使用 Archive 预警”。</dd>
            </dl>
            <p>您还可以使用“附加标签”字段添加其她或更详细的预警。有关预警的政策请参阅<a href="/content#II.J">服务条款</a>及<a href="/tos_faq#ratings_warnings_faq">服务条款常见问题</a>。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '预警 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用翻译函数：翻译“同人圈”相关的帮助文本框
 */
function translateFandomHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Fandom help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>同人圈标签</h4>
            <p>您的作品所属的同人圈名称。请使用全称，而非缩写。您可以列出多个同人圈，使用逗号分隔（例如，您的作品是跨圈同人文）。</p>
            <p>要了解有关标签的更多信息，包括如何添加 Archive 上尚不存在的标签，请参阅我们的<a href="/faq/tags">标签常见问题解答</a>。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '同人圈 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用翻译函数：翻译“书签图标”说明弹窗
 */
function translateBookmarkSymbolsKeyModal() {
	const footerTitle = document.querySelector('#modal div.footer span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark symbols key') {
		return;
	}
	const modal = footerTitle.closest('#modal');
	if (!modal) {
		return;
	}
	const mainTitle = modal.querySelector('div.content.userstuff > h4');
	if (mainTitle) {
		mainTitle.textContent = '书签图标';
	}
	const definitions = modal.querySelectorAll('#bookmark-symbols-key > dd');
	const translations = [
		'推荐',
		'公开书签',
		'私人书签',
		'此书签已被管理员隐藏'
	];
	if (definitions.length === translations.length) {
		definitions.forEach((dd, index) => {
			dd.textContent = translations[index];
		});
	}
	footerTitle.textContent = '书签图标说明';
	const closeButton = modal.querySelector('div.footer a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
	modal.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用翻译函数：翻译“分级”相关的帮助文本框
 */
function translateRatingHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Rating help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>分级标签</h4>
            <p>（要了解更多信息，请参阅 <a href="/content#II.J">AO3 服务条款的分级与预警部分</a>。）</p>
            <dl id="help">
                <dt>未分级 (Adult!)</dt>
                <dd>
                    在搜索、筛选及其她 Archive 功能中，未分级内容可能与限制级内容受到同等处理。实际上，其内容可能涵盖色情至完全适合家庭观看的各类作品。若您不想为内容评级（例如不喜欢评级、避免剧透等），请选择此项。
                </dd>
                <dt>全年龄</dt>
                <dd>
                    内容适合所有读者。
                </dd>
                <dt>青少年及以上</dt>
                <dd>
                    内容可能不适合 13 岁以下读者。
                </dd>
                <dt>成人向 (Adult!)</dt>
                <dd>
                    适用于含有成人主题（性、暴力等），但描写不如“限制级”血腥的作品。
                </dd>
                <dt>限制级 (Adult!)</dt>
                <dd>
                    适用于含有色情、血腥暴力等内容的作品。
                </dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '分级 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译分类标签帮助弹窗。
 */
function translateCategoriesHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Categories help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>分类标签</h4>
            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
            <p>Archive 上的作品分为 6 类。以下为各缩写含义，具体定义因同人圈和用户而异；请选择最适用的分类，或留空：</p>
            <dl>
                <dt>女/女</dt>
                <dd>女性/女性配对</dd>
                <dt>女/男</dt>
                <dd>女性/男性配对</dd>
                <dt>无CP</dt>
                <dd>无恋爱关系或性关系, 或者恋爱关系并非作品重点</dd>
                <dt>男/男</dt>
                <dd>男性/男性配对</dd>
                <dt>多配对</dt>
                <dd>含有一种以上的配对，或者含有数个伴侣的配对</dd>
                <dt>其她</dt>
                <dd>其她关系</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '分类 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译关系标签帮助弹窗。
 */
function translateRelationshipsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Relationships help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>关系标签</h4>
            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
            <p>对于您作品中存在的关系，请尽可能使用全名（例如"Mickey Mouse/Minnie Mouse"或"Rodney McKay &amp; John Sheppard"），可通过逗号分隔列出多个关系。请注意，所有用户创建的标签均不得超过 150 字符；若作品包含大型多角关系或名称较长的多名角色，建议将名称缩短为仅有名字或带首字母的姓氏，以避免超过字符限制且保持可识别性。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '关系 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译角色标签帮助弹窗。
 */
function translateCharactersHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Characters help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>角色标签</h4>
            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
            <p>您作品中的主要角色，请使用全名并以逗号分隔。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '角色 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Additional Tags"帮助弹窗的文本。
 */
function translateAdditionalTagsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Additional tags help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>附加标签</h4>
            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
            <p>您希望为作品添加的其她标签（例如："虐心"、"跨圈"或"触手"）。您也可以用此字段来标注 Archive 预警中未涵盖的内容。请不要在此填写同人圈、关系或角色名称。多个标签请用逗号分隔。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '附加标签 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Adding To Collections"帮助弹窗的文本。
 */
function translateCollectionsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Add collectible to collection') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>添加到合集</h4>
            <p>
                以逗号分隔输入合集名称，您正在编辑的作品将被添加到您指定的所有合集中。
            </p>
            <p>
                请注意，您需要使用合集的名称（用于生成合集网址），而非其展示标题（因为不同合集允许重名）。合集名称与您的用户登录名相同。若启用 JavaScript ，名称会自动补全。
            </p>
            <p>
                另请注意，如果您提交的合集受管理员审核，且您不是成员，您的作品不会自动添加——必须等待管理员批准后才会加入。如果这是匿名和/或未公开的合集，则作品发布后立即以匿名和/或隐藏状态展示，包括在等待审核期间。若作品被拒，则会保持匿名和/或未公开状态，直到您将其从合集中移除或管理员取消关联。
            </p>
            <p>
                如果您改变主意想将作品从合集中移除，可在编辑时修改合集列表，或在账户的"我的合集"页面管理所有已创建书签作品。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '将作品添加到合集';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Recipients"帮助弹窗的文本。
 */
function translateRecipientsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Recipients') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>赠文对象</h4>
            <p>
                请输入赠文对象的名称，以逗号分隔！
            </p>
            <p>
                如果您的作品是送给某人的礼物或为她们而作，您可以在此输入她们的姓名，作品署名下方会显示这些信息。
                赠文对象<strong>无需</strong>是 Archive 的注册用户，但如果有匹配的笔名，自动补全会提供建议。我们会通知被选为赠文对象的注册用户。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '赠文对象';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Parent Works Help"帮助弹窗的文本。
 */
function translateParentWorksHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Parent works help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>母作品帮助</h4>
            <p>
                如果您正在创建新作品，目前只能添加一个灵感来源。
                若要添加更多，请先保存您的作品，然后在已发布作品页面点击"编辑"按钮，再像之前那样添加新的灵感来源。
            </p>
            <p>
                您添加为灵感来源的所有作品将显示在此表单下方，标题为"当前母作品"。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '母作品 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Choosing Series"帮助弹窗的文本。
 */
function translateChoosingSeriesHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Choosing series') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>选择系列</h4>
            <p>
                系列是一组相关的故事，每个故事独立完整。
                您可以随时在个人中心中创建新系列或将作品添加到系列中。
            </p>
            <p>
                如果您想发布正在创作中的作品或分章节故事，请选择多章节作品功能。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '选择系列';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Publication Date Options"帮助弹窗的文本。
 */
function translateBackdatingHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Backdating help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>发布日期选项</h4>
            <p>
                发布作品时，您可以选择设置不同的发布日期——也就是为作品回溯日期。您也可以为各单独章节设置发布日期。请注意，这两种情况下都会影响作品在个人中心和作品页面中的显示顺序和位置。这些页面显示的更新日期，将取您作品或任一章节的发布日期，以较晚者为准。
            </p>
            <p>
                您添加的后续章节将在表单中预填此日期，您仍可手动覆盖该日期。这意味着如果您不清楚或不在意章节的实际发布日期，也能方便地为作品回溯日期。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '回溯日期 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译"Languages"帮助弹窗的文本。
 */
function translateLanguagesHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Languages help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>语言</h4>
            <p>列表中没有您的语言？请<a href="/support">通过支持表单告诉我们</a>，我们会很高兴将其添加！（请放心，您现在可以发布作品，并在稍后更改语言。）外部作品无需选择语言。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '语言 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 Work Skins 弹窗页面的帮助文本。
 */
function translateWorkSkins() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work skins') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品界面</h4>
            <p>
            您可以像为 Archive 创建界面一样，为您的作品创建自定义样式表或"界面"。主要区别在于，作品界面会改变<strong>其她用户</strong>查看作品的方式，而不仅仅是您自己看到的效果。
            </p>
            <p>
            作品界面<strong>仅</strong>影响所应用作品的正文——无法通过它们更改 Archive 的导航或背景。不过，您可以创建自定义类。例如，您可以更改部分文字的颜色，对某些段落进行特定方式的缩进，等等。
            </p>
            <p>
            例如，假设您希望将文中某个单词设置为亮蓝色，可以按以下步骤操作：
            </p>
            <ul>
            <li>
                <a href="/skins/new?skin_type=WorkSkin">创建一个作品界面</a>，内容如下：<code>.bluetext {color: blue;}</code>
            </li>
            <li>
                发布作品时选择此界面。
            </li>
            <li>
                在作品的 HTML 中为该单词添加此样式类：<code>I want &lt;span class="bluetext"&gt;house&lt;/span&gt; to be in blue</code>
            </li>
            </ul>
            <p>
            要了解更多信息，请参阅<a href="/faq/tutorial-creating-a-work-skin">教程：创建作品界面</a>和<a href="/faq/skins-and-archive-interface">界面与 Archive 界面常见问题</a>。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品界面';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 Registered Users 弹窗页面的帮助文本。
 */
function translateRegisteredUsers() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Registered users') {
		return;
	}
	if (container) {

		container.innerHTML = `
            <h4>注册用户</h4>
            <p>
            注册用户是拥有 Archive 账号的用户。勾选此选项后，您的作品仅限已登录用户查看。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '注册用户';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 Comments Moderated 弹窗页面的帮助文本。
 */
function translateCommentsModerated() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Comments moderated') {
		return;
	}
	if (container) {

		container.innerHTML = `
            <h4>评论需审核</h4>
            <p>启用此功能后，您必须审核并批准所有评论，评论才会在作品上公开显示。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '评论需审核';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 Who can comment on this work 弹窗页面的帮助文本。
 */
function translateWhoCanComment() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Who can comment on this work') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>谁可以评论此作品？</h4>
            <dl>
            <dt>注册用户及访客可评论</dt>
            <dd>所有用户均可评论（无论是否登录）。</dd>
            <dt>仅注册用户可评论</dt>
            <dd><strong>默认选项</strong>，仅登录用户可评论此作品。</dd>
            <dt>禁止评论</dt>
            <dd>此选项将禁用所有新的评论。</dd>
            </dl>
            <p>更改设置不会影响现有评论。如需删除已有评论，请参阅<a href="/faq/comments-and-kudos#commentother">我能编辑或删除她人留下的评论吗？</a>以了解详情。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '谁可以评论此作品';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译导入疑难解答弹窗的帮助文本。
 */
function translateWorkImportTroubleshooting() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work import') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>导入疑难解答</h4>
            <p>
            如果您的文本在出现破折号或带重音字符处被截断，您可能需要使用下方的"设置自定义编码"菜单手动设置编码，才能成功导入作品。有效的编码类型可能有所不同；您可能需要尝试多个选项以找到正确的编码。有关更多信息，请参阅<a href="/help/encoding-help.html">编码帮助页面</a>。
            </p>
            <p>
            如果您要从 e-fiction 网站导入带章节的作品，您需要分别输入每一章的 URL ，每行一个。一次最多可以导入 200 个章节。有关从其她网站导入作品的更多信息，请参阅<a href="/faq/posting-and-editing#importwork">"我如何从其她网站导入作品？"</a>
            </p>
            <p>
            如果您想将已发布在 AO3 上的作品从一个用户账户转移到另一个账户，您必须编辑现有作品，将新账户添加为共同创作者，然后移除旧账户。不能使用导入工具处理 AO3 上托管的作品。
            </p>
            <p>
            除非您勾选"覆盖标签和说明"选项框，否则您在"标签"下输入的信息仅在导入工具无法从作品中识别标签时才会使用。
            </p>
            <p>
            导入完成后，您将可以编辑并完善标准的作品信息。有关发布和编辑的更多信息，请参阅<a href="/faq/posting-and-editing">发布与编辑常见问题</a>。
            </p>
            <p>
            如果上述信息都无法解决您的问题，您也许可以在<a href="/known_issues#importing">已知问题</a>页面中找到答案。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品导入';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译编码帮助弹窗的帮助文本。
 */
function translateEncodingHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Encoding help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>编码帮助</h4>
            <p>如果导入工具剥离了作品中的特殊字符（例如变音符号或弯引号），或未能导入整段文本，可能是由于自动检测您作品编码时出现了问题。UTF-8 是常见的编码，但也有其她编码需要您手动指定，以帮助导入工具正确处理您的作品。</p>
            <p>如果不确定文本使用的编码，可以尝试 ISO-8859-1（通常称为 Latin-1）或 Windows-1252（有时被误称为 ANSI），这两种编码在 Windows 程序的输出中非常常见。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '编码 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /users/edit 页面上“隐私偏好”弹窗的帮助文本。
 */
function translatePrivacyPreferences() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Privacy preferences') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>隐私偏好</h4>
            <dl id="help">
                <dt>向其她人显示我的邮箱地址</dt>
                <dd>
                    启用此选项后，与您的账户关联的电子邮箱地址将在您的用户资料页面公开可见。
                </dd>
                <dt>向其她人显示我的出生日期</dt>
                <dd>
                    启用此选项后，与您的账户关联的出生日期将在您的用户资料页面公开可见。
                </dd>
                <dt>尽可能地对搜索引擎隐藏我的作品</dt>
                <dd>
                    启用此选项将告知搜索引擎不要索引您的用户页面、作品或系列。请注意，并非所有搜索引擎都会遵守此设置。列出您作品或系列的页面----例如作品主页面----可能仍会被索引。如果您希望在任何情况下都避免作品或系列被索引，建议将它们仅限 Archive 注册用户可见。
                </dd>
                <dt>隐藏我作品中的分享按钮</dt>
                <dd>
                    <p>
                        此偏好设置允许您禁用一键分享按钮。该按钮可让她人将您的作品推荐到 Twitter、Tumblr 等外部网站。
                    </p>
                    <p>
                        请注意，一旦您在线发布了作品，读者仍可复制并粘贴链接到任何位置----如果您想限制对作品的访问，最佳方法是将作品锁定，仅限 Archive 注册用户查看。
                    </p>
                </dd>
                <dt>允许其她人邀请我成为共同创作者</dt>
                <dd>
                    <p>
                        启用此选项将允许其她 AO3 用户邀请您以共创者的身份列在作品、章节或系列中。在您接受邀请前，您不会在网站上任何地方以共创者身份出现。如果启用此选项，您可以在个人中心的“共创者请求”中查看收到的请求，并会收到一封通知邮件。
                    </p>
                    <p>
                        禁用此选项将阻止其她用户邀请您成为作品、章节或系列的共创者，您也不会收到任何通知。
                    </p>
                    <p>
                        更改此设置不会影响任何现有的共创作品。
                    </p>
                </dd>
            </dl>
            <p>要了解有关偏好设置及其含义的更多信息，请参阅我们的<a href="/faq/preferences">偏好常见问题</a>。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '隐私偏好';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“显示偏好”弹窗的内容。
 */
function translateDisplayPreferences() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Display preferences') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>显示偏好</h4>
            <dl id="help">
            <dt>无需确认即可显示成人内容</dt>
            <dd>
                启用此选项后，在显示作品前不会提示您确认是否访问“成人向”、“限制级”或“未分级”作品。
            </dd>
            <dt>默认显示全文</dt>
            <dd>
                启用此选项后，多章节作品将作为单页显示。
            </dd>
            <dt>隐藏内容预警（仍可手动显示）</dt>
            <dd>
                启用此选项后，作品上的 Archive 预警标签将默认隐藏。您可以点击“显示预警”查看个别作品的内容预警。此功能需启用 JavaScript 。
            </dd>
            <dt>隐藏附加标签（仍可手动显示）</dt>
            <dd>
                启用此选项后，作品上的附加标签将默认隐藏。您可以点击“显示附加标签”查看个别作品的附加标签。此功能需启用 JavaScript 。
            </dd>
            <dt>隐藏她人作品界面</dt>
            <dd>
                启用此选项后，其她用户为其作品设定的自定义界面将不会显示，系统将使用您的默认站点界面。
            </dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '显示偏好';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“界面基础”弹窗的内容。
 */
function translateSkinsBasics() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins basics') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <p>
            站点界面可让您在登录账户时自定义浏览体验。不喜欢 Archive 的字体？您可以更改它们！不喜欢红色页眉？换成蓝色！请记住，在创建站点界面时，您只是在为自己更改 Archive ——其她用户将按照她们各自的界面看到 Archive 。换言之，站点界面可帮助您打造理想的个人浏览体验，而不会影响她人查看作品的方式。
            </p>
            <p>
            作品界面可让您更改一个或多个作品在她人眼中的显示方式。作品界面仅影响作品正文——您无法更改 Archive 的导航或背景在其她用户那里显示的样式。但您可以创建自定义样式类，例如更改部分文字的颜色，或以特定方式缩进段落，等等。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面基础';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“作品标题格式”帮助弹窗。
 */
function translateWorkTitleFormat() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work_title_format') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品标题格式</h4>
            <p>指定在阅读作品时浏览器标签页标题的显示方式。示例：</p>
            <dl>
            <dt>标题 - 作者 - 同人圈</dt>
            <dd>这是默认格式</dd>
            <dt>标题 - 作者</dt>
            <dd>不包含同人圈</dd>
            <dt>同人圈_作者_标题</dt>
            <dd>以同人圈、作者、标题的顺序显示，并用下划线替代连字符。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品标题格式';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“评论偏好”帮助弹窗。
 */
function translateCommentPreferences() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Comment preferences') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>评论偏好</h4>
            <dl id="help">
            <dt>关闭评论邮件通知</dt>
            <dd>启用此选项后，当有人在您的作品上发表评论或回复您发表的评论时，您将不会收到电子邮箱提醒。评论通知仍会发送到您的 AO3 收件箱，除非您已选择禁用收件箱通知。</dd>
            <dt>关闭评论消息通知</dt>
            <dd>启用此选项后，当有人在您的作品上发表评论或回复您发表的评论时，您将不会在 AO3 收件箱中收到通知。评论通知仍会通过电子邮箱发送给您，除非您已选择禁用电子邮箱通知。</dd>
            <dt>关闭自己评论的副本通知</dt>
            <dd>启用此选项后，您将不会收到针对自己发表评论（例如回复自己作品评论）的电子邮箱通知。</dd>
            <dt>关闭点赞邮件通知</dt>
            <dd>启用此选项后，当有人对您的作品点赞时，您将不会收到电子邮箱通知。</dd>
            <dt>不允许游客回复我在动态帖或其她用户作品中的评论</dt>
            <dd>启用此选项后，未登录 AO3 账户的用户将无法回复您在动态贴或其她用户作品中留下的评论。此设置不适用于您自己的作品评论；如需了解如何控制其她用户与您作品的互动，请参阅<a href="/faq/posting-and-editing#controlaccess">发布与编辑常见问题</a>。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '评论偏好';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“合集、挑战与赠文偏好”帮助弹窗。
 */
function translateCollectionPreferences() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Collection preferences') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>合集、活动与赠文偏好</h4>
            <dl id="help">
            <dt>允许其她人将我的作品加入合集</dt>
            <dd>
                <p>启用此选项后，其她 AO3 用户可邀请您的作品加入其合集。在您接受邀请前，作品不会被添加。要了解有关接受合集邀请的更多信息，请参阅<a href="/faq/collections#collectionitems">如何批准或拒绝包含我的作品的合集邀请</a>。</p>
                <p>禁用此选项将完全阻止她人邀请您的作品加入其合集，且您不会收到任何通知。</p>
                <p>更改此设置不会影响已在合集中的现有作品。</p>
            </dd>

            <dt>允许任何人向我赠送作品</dt>
            <dd>若禁用此选项，用户仅可在完成赠文活动分配或满足征稿活动要求时赠送作品给您。若希望允许用户在无分配或征稿要求的情况下赠送作品，请启用此选项。请注意，您随时可以单独拒绝赠文。要了解有关拒绝赠文的操作，请参阅<a href="/faq/your-account#refusegift">如何拒绝赠文</a>。</dd>

            <dt>关闭来自合集的电子邮箱</dt>
            <dd>启用此选项后，您将不会收到来自合集的电子邮箱提醒，如作者或作品的揭晓通知。但若您的用户名或作品在加入合集后被隐藏，仍会收到电子邮箱。除非您禁用收件箱通知，合集通知仍会发送到您的 AO3 收件箱。</dd>

            <dt>关闭来自合集的消息通知</dt>
            <dd>启用此选项后，您将不会在 AO3 收件箱中收到来自合集的通知，例如隐藏作品揭晓通知。但除非您禁用电子邮箱通知，这些通知仍会以电子邮箱形式发送给您。</dd>

            <dt>关闭有关赠文的邮件通知</dt>
            <dd>启用此选项后，当有人赠送作品给您时，您将不会收到电子邮箱提醒。通知仍会显示在您的“接收赠文”页面。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '合集偏好';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“其她偏好”帮助弹窗。
 */
function translateMiscPreferences() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Misc preferences') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>其她偏好</h4>
            <dl id="help">
            <dt>启用历史记录</dt>
            <dd>启用后，历史记录会保留您登录时访问的每个作品日志。您可以删除单个作品或清除整个历史记录。如果先启用后再禁用，此前访问的作品仍会保留（但需再次启用历史记录才能查看）。</dd>
            <dt>重新显示新用户帮助横幅</dt>
            <dd>启用此选项将重新显示提供入门信息和提示的新用户帮助横幅！</dd>
            <dt>关闭每个页面的提示横幅</dt>
            <dd>AO3 可能会通过提示横幅通知用户重要事件或站点变更。如要在登录时隐藏横幅，请启用此选项。请注意，这仅会隐藏您启用时显示的横幅。如横幅内容更换，新横幅将继续显示，直到您再次启用此选项。</dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '其她偏好';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译筛选侧边栏中的“包含标签”帮助文本。
 */
function translateTagFiltersIncludeTags() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work filters include tags') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>标签筛选：包含标签</h4>
            <p>筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要包括的其她标签”字段。</p>
            <p>如果您感兴趣的标签不在前十个中，请在“要包括的其她标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本。可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。</p>
            <p>您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。</p>
            <p>从类别中选择任意标签,或在“要包括的其她标签”字段中输入标签，将与您选择的所有标签进行 AND 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/works">女/女类别标签的作品</a>，选择 <samp>青少年及以上</samp> 分级，在附加标签类别中选择规范的 <samp>Romance（爱情）</samp> 标签，并在“要包括的其她标签”字段中输入或选择规范的<samp> Drama（剧情） </samp>标签，则结果中只会包含<a href="/works?utf8=%E2%9C%93&work_search[sort_column]=revised_at&work_search[rating_ids][]=11&work_search[freeform_ids][]=60&work_search[other_tag_names]=Drama&work_search[query]=&work_search[language_id]=&work_search[complete]=0&commit=Sort+and+Filter&tag_id=F%2FF">同时带有所有这些标签的作品</a>。</p>
            <p>若要获取包含 标签A 或 标签B 的结果，请使用“在结果中搜索”字段。</p>
            <p>要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。</p>
            <p>要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品筛选：包括标签';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译筛选侧边栏中的“排除标签”帮助文本。
 */
function translateTagFiltersExcludeTags() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work filters exclude tags') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>标签筛选：排除标签</h4>
            <p>筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要排除的其她标签”字段。</p>
            <p>如果您想排除的标签不在前十个中，请在“要排除的其她标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本，可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。</p>
            <p>您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。</p>
            <p>从类别中选择任意标签,或在“要排除的其她标签”字段中输入标签，将与您选择的所有标签进行 OR 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/works">女/女类别标签的作品</a>，选择 <samp>主要角色死亡</samp> 预警，在附加标签类别中选择规范的 <samp>Alternate Universe（平行世界）</samp> 标签，并在“要排除的其她标签”字段中输入或选择规范的 <samp>Drama（剧情）</samp> 标签，则结果中只会包含<a href="/works?utf8=%E2%9C%93&work_search%5Bsort_column%5D=revised_at&work_search%5Bother_tag_names%5D=&exclude_work_search%5Bwarning_ids%5D%5B%5D=18&exclude_work_search%5Bfreeform_ids%5D%5B%5D=968&work_search%5Bexcluded_tag_names%5D=Drama&work_search%5Bquery%5D=&work_search%5Blanguage_id%5D=&work_search%5Bcomplete%5D=0&commit=Sort+and+Filter&tag_id=F*s*F">不带有<em>任何</em>这些标签的作品</a>。</p>
            <p>要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。</p>
            <p>要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品筛选：排除标签';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“包含标签”筛选帮助的文本。
 */
function translateBookmarkFiltersIncludeTags() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark filters include tags') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>标签筛选：包含标签</h4>
            <p>
                筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要包括的其她作品标签”和“要包括的其她书签创建者标签”字段。
            </p>
            <p>
                如果您感兴趣的标签不在前十个中，请在“要包括的其她作品标签”或“要包括的其她书签创建者标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本，可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。
            </p>
            <p>
                您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”和“搜索书签创建者标签和注释”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。
            </p>
            <p>
                从类别中选择任意标签,或在“要包括的其她作品标签”或“要包括的其她书签创建者标签”字段中输入标签，将与您选择的所有标签进行 AND 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/bookmarks">女/女类别标签的书签</a>，选择 <samp>青少年及以上</samp> 分级，在附加标签类别中选择规范的 <samp>Romance（爱情）</samp> 标签，并在“要包括的其她作品标签”字段中输入或选择规范的 <samp>Drama（剧情）</samp> 标签，结果中只会包含<a href="/bookmarks?utf8=✓&bookmark_search%5Bsort_column%5D=created_at&include_bookmark_search%5Brating_ids%5D%5B%5D=11&include_bookmark_search%5Bfreeform_ids%5D%5B%5D=60&bookmark_search%5Bother_tag_names%5D=Drama&bookmark_search%5Bother_bookmark_tag_names%5D=&bookmark_search%5Bexcluded_tag_names%5D=&bookmark_search%5Bexcluded_bookmark_tag_names%5D=&bookmark_search%5Bbookmarkable_query%5D=&bookmark_search%5Bbookmark_query%5D=&bookmark_search%5Brec%5D=0&bookmark_search%5Bwith_notes%5D=0&commit=Sort+and+Filter&tag_id=F*s*F">同时带有所有这些标签的作品或系列的书签</a>。
            </p>
            <p>
                若要获取包含标签 A 或 标签 B 的结果，请使用“在结果中搜索”或“搜索书签创建者标签和注释”字段。
            </p>
            <p>
                要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。
            </p>
            <p>
                要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签筛选：包括标签';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /bookmarks/search 页面上“排除标签”筛选帮助的文本。
 */
function translateBookmarkFiltersExcludeTags() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Bookmark filters exclude tags') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>标签筛选：排除标签</h4>
            <p>
                筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要排除的其她作品标签”或“要排除的其她书签创建者标签”字段。
            </p>
            <p>
                如果您想排除的标签不在前十个中，请在“要排除的其她作品标签”或“要排除的其她书签创建者标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本，可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。
            </p>
            <p>
                您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，则筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”和“搜索书签创建者标签和注释”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。
            </p>
            <p>
                从类别中选择任意标签，或在“要排除的其她作品标签”或“要排除的其她书签创建者标签”字段中输入标签，将对您选择的所有标签执行 OR 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/bookmarks">女/女类别标签的书签</a>，选择 <samp>主要角色死亡</samp> 预警，在附加标签类别中选择规范的 <samp>Alternate Universe（平行世界）</samp> 标签，并在“要排除的其她作品标签”字段中输入或选择规范的 <samp>Drama（剧情）</samp> 标签，则结果中只会包含<a href="/bookmarks?utf8=✓&bookmark_search%5Bsort_column%5D=created_at&bookmark_search%5Bother_tag_names%5D=&bookmark_search%5Bother_bookmark_tag_names%5D=&exclude_bookmark_search%5Bwarning_ids%5D%5B%5D=18&exclude_bookmark_search%5Bfreeform_ids%5D%5B%5D=968&bookmark_search%5Bexcluded_tag_names%5D=Drama&bookmark_search%5Bexcluded_bookmark_tag_names%5D=&bookmark_search%5Bbookmarkable_query%5D=&bookmark_search%5Bbookmark_query%5D=&bookmark_search%5Brec%5D=0&bookmark_search%5Bwith_notes%5D=0&commit=Sort+and+Filter&tag_id=F*s*F">不带任何这些标签的书签</a>。
            </p>
            <p>
                要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。
            </p>
            <p>
                要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '书签筛选：排除标签';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /works/search 页面上“结果”相关的帮助文本。
 */
function translateWorkSearchResultsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Work search results help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>作品搜索：结果</h4>
            <p>符合条件的最新作品将显示在列表顶部。否则，列表将按相关性排序。如果作品数量众多，您可能需要更改搜索词而非翻页浏览结果。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '作品搜索：结果 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins approval”弹窗的提示信息。
 */
function translateSkinsApprovalModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins approval') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>公共界面</h4>
            <p>
                AO3 不再将新用户创建的界面添加到公共界面列表，因此您目前无法申请公开您的界面。此复选框仅供站点管理员将新的公共站点界面添加到列表中使用。但是，您仍然可以在<a href="/skins?skin_type=Site">公共站点界面</a>和<a href="/skins?skin_type=WorkSkin">公共作品界面</a>中使用用户创建的界面，也可以继续创建供个人使用的界面。
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面审核';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins creating”弹窗中的 CSS 帮助文本。
 */
function translateSkinsCreatingModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins creating') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <dl id="help">
                <dt>您可以使用我们的向导或编写自己的 CSS（层叠样式表）代码为 Archive 创建新的界面</dt>
                <dd>
                    <p>请注意，出于安全原因，您只能使用有限的 CSS 代码集：所有其她声明和注释都将被移除！</p>
                </dd>

                <dt>我们允许使用以下属性及其所有变体（包括简写）</dt>
                <dd>
                    <p><code>background, border, column, cue, flex, font, layer-background, layout-grid, list-style, margin, marker, outline, overflow, padding, page-break, pause, scrollbar, text, transform, transition</code></p>
                </dd>

                <dt>我们还允许以下特定属性</dt>
                <dd>
                    <p><code>-replace, -use-link-source, accelerator, align-content, align-items, align-self, alignment-adjust, alignment-baseline, appearance, azimuth, baseline-shift, behavior, binding, bookmark-label, bookmark-level, bookmark-target, bottom, box-align, box-direction, box-flex, box-flex-group, box-lines, box-orient, box-pack, box-shadow, box-sizing, caption-side, clear, clip, color, color-profile, color-scheme, content, counter-increment, counter-reset, crop, cue, cue-after, cue-before, cursor, direction, display, dominant-baseline, drop-initial-after-adjust, drop-initial-after-align, drop-initial-before-adjust, drop-initial-before-align, drop-initial-size, drop-initial-value, elevation, empty-cells, filter, fit, fit-position, float, float-offset, font, font-effect, font-emphasize, font-emphasize-position, font-emphasize-style, font-family, font-size, font-size-adjust, font-smooth, font-stretch, font-style, font-variant, font-weight, grid-columns, grid-rows, hanging-punctuation, height, hyphenate-after, hyphenate-before, hyphenate-character, hyphenate-lines, hyphenate-resource, hyphens, icon, image-orientation, image-resolution, ime-mode, include-source, inline-box-align, justify-content, layout-flow, left, letter-spacing, line-break, line-height, line-stacking, line-stacking-ruby, line-stacking-shift, line-stacking-strategy, mark, mark-after, mark-before, marks, marquee-direction, marquee-play-count, marquee-speed, marquee-style, max-height, max-width, min-height, min-width, move-to, nav-down, nav-index, nav-left, nav-right, nav-up, opacity, order, orphans, page, page-policy, phonemes, pitch, pitch-range, play-during, position, presentation-level, punctuation-trim, quotes, rendering-intent, resize, rest, rest-after, rest-before, richness, right, rotation, rotation-point, ruby-align, ruby-overhang, ruby-position, ruby-span, size, speak, speak-header, speak-numeral, speak-punctuation, speech-rate, stress, string-set, tab-side, table-layout, target, target-name, target-new, target-position, top, unicode-bibi, unicode-bidi, user-select, vertical-align, visibility, voice-balance, voice-duration, oice-family, voice-pitch, voice-pitch-range, voice-rate, voice-stress, voice-volume, volume, white-space, white-space-collapse, widows, width, word-break, word-spacing, word-wrap, writing-mode, z-index</code></p>
                </dd>

                <dt>查看其她公共界面示例</dt>
                <dd>
                    <p><a href="/skins">所有已批准的公共界面</a>均可查看其代码，您可复制并编辑以供个人使用。</p>
                </dd>

                <dt>每条规则集中每个属性只使用一个声明</dt>
                <dd>
                    <p>我们使用的 CSS 解析器仅保留每个属性的一个声明，这意味着像<br></p>
                    <pre><code>.my-class {
background: -moz-linear-gradient(top, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%);
background: -o-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%);
background: -webkit-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%);
}</code></pre>
                    <p>这样的规则集将只保留最后一个 <code>background</code> 声明（因此您的渐变效果仅在 WebKit 浏览器中显示）。为避免丢失重复属性的声明，请将每个声明拆分到独立的规则集中，如：</p>
                    <pre><code>.my-class { background: -moz-linear-gradient(top, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%); }
.my-class { background: -o-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); }
.my-class { background: -webkit-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); }</code></pre>
                </dd>

                <dt>字体与字体族</dt>
                <dd>
                    <p>遗憾的是，您不能在 CSS 中使用 <code>font</code> 简写。所有 font 属性必须分别指定，例如：<code>font-size: 1.1em; font-weight: bold; font-family: Cambria, Constantia, Palatino, Georgia, serif;</code></p>
                    <p>在 <code>font-family</code> 属性中，我们允许您使用字母数字名称指定任何字体。您可以（但不必）使用单引号或双引号将名称括起，只需确保引号成对匹配。（例如，'Gill Sans' 和 "Gill Sans" 都可；'Gill Sans" 则不可。）请记住，字体必须安装在用户的操作系统中才能生效。建议在指定字体时添加备用字体，以防首选字体不可用。请参阅<a href="https://www.w3schools.com/cssref/css_fonts_fallbacks.asp">包含备用字体的网页安全字体集</a>。</p>
                    <p>抱歉，我们<strong>不允许</strong>使用 <code>@font-face</code> 属性。如果您想在要分享的界面中使用不常见字体，建议在“描述”字段中添加注释，提供用户自行下载该字体的链接，并使用网页安全字体作为备用。</p>
                </dd>

                <dt>URLs</dt>
                <dd>
                    <p>我们允许使用 JPG 、GIF 和 PNG 格式的外部图像 URL（格式如 <code>url('https://example.com/my_awesome_image.jpg')</code>）。但请注意，使用外部图像的界面将不会被批准为公共界面。</p>
                </dd>

                <dt>关键词</dt>
                <dd>
                    <p>我们允许所有标准 CSS 关键词值（例如 <code>absolute</code>、<code>bottom</code>、<code>center</code>、<code>underline</code> 等）。</p>
                </dd>

                <dt>数值</dt>
                <dd>
                    <p>您可以指定最多两位小数的数值，作为百分比或<a href="https://w3schools.com/css/css_units.asp">各种单位</a>：<br><code>cm, em, ex, in, mm, pc, pt, px</code></p>
                    <p>PS：我们强烈建议学习并使用 <code>em</code>，它可以让您根据查看者当前的字体大小设置布局！这将使您的布局更加灵活，并响应不同的浏览器/字体设置。</p>
                </dd>

                <dt>颜色</dt>
                <dd>
                    <p>您可以使用十六进制值（例如，<code>#000000</code> 表示十六进制黑色）或 RGB 、RGBA 值（例如 <code>rgb(0,0,0)</code> 和 <code>rgba(0,0,0,0)</code> 都表示黑色）指定颜色。这可能更安全，因为并非所有浏览器都一定支持所有颜色名称。但是，颜色名称更具可读性且易于记忆，因此我们也允许使用颜色名称。（建议您坚持使用<a href="https://www.w3schools.com/colors/colors_names.asp">常见支持的颜色名称集</a>。）</p>
                </dd>

                <dt>缩放</dt>
                <dd>
                    <p>您可以为 <code>transform</code> 属性指定 <code>scale(数值)</code> 形式的缩放，其中数值最多可指定两位小数。</p>
                </dd>

                <dt>注释</dt>
                <dd>
                    <p>CSS 中的注释会被移除。</p>
                </dd>

                <dt>如果您是 CSS 新手，以下是基础知识：</dt>
                <dd>
                    <p>一行 CSS 代码的格式类似：<code>selector {property: value;}</code></p>
                    <p><strong>selector</strong> 是要更改的 HTML 标签名称（如 <code>body</code> 或 <code>h1</code>），或已在标签上设置的 id 或 class。<strong>property</strong> 是您要更改的属性（例如字体大小），<strong>value</strong> 是您要设置的值。</p>
                    <p>示例：</p>
                    <ul>
                        <li>设置 <code>body</code> 标签内的字体大小略大于基线：<code>body {font-size: 1.1em;}</code></li>
                        <li>设置 id 为 <code>#header</code> 的标签背景色为紫色：<code>#header {background-color: purple}</code></li>
                        <li>设置 class 为 <code>.meta</code> 的标签文本闪烁（不建议使用）：<code>.meta {font-style: blink}</code></li>
                    </ul>
                    <p>一些有用的 CSS 教程：</p>
                    <ul>
                        <li><a href="https://www.w3schools.com/css/css_intro.asp">CSS 入门教程</a></li>
                        <li><a href="http://developer.mozilla.org/docs/CSS/Getting_Started">MDN 上的 CSS 入门教程</a></li>
                    </ul>
                </dd>
            </dl>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面创建';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skin Conditions”弹窗的帮助文本。
 */
function translateSkinsConditionsModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins conditions') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h3>界面条件</h3>
            <p>如果您希望在特定情况下仅加载某段 CSS ，可以为界面创建一组特定的条件。只有满足条件时，我们才会加载该界面。可用的条件有：</p>
            <ul>
                <li>
                    <h4>作用方式</h4>
                    <dl>
                        <dt>添加到 Archive 样式之后</dt>
                        <dd>95% 的情况下使用此选项。将在官方 Archive 样式之后加载。</dd>
                        <dt>完全替换 Archive 样式</dt>
                        <dd>适用于复杂界面，不想保留大部分默认样式时使用。（可将需要保留的部分设为母级界面。）</dd>
                    </dl>
                </li>
                <li>
                    <h4>仅限母级</h4>
                    <p class="note">此选项主要用于保持界面列表整洁。如果选择此项，您（及其她用户）将无法直接使用该界面：它仅作为母级被引用。即使公开，其也不会出现在主界面列表中，只会在引用它作为母级的界面说明中列出。这样可以方便地提供组件供她人使用，而不会因无法独立使用而在列表中产生混乱。:)</p>
                </li>
                <li>
                    <h4>媒体类型</h4>
                    <p class="note">您可选择多个媒体类型。仅当所用设备支持该媒体类型时，才会加载对应样式表。例如，并非所有屏幕阅读器都会加载“speech”样式表。如果您的设备未加载界面，请改用“all”或“screen”，或提交支持请求以获取帮助。</p>
                    <dl>
                        <dt>all</dt>
                        <dd>大多数情况下使用。适用于所有设备。（某些极老的浏览器不识别“all”，需使用“screen”。）</dd>
                        <dt>screen</dt>
                        <dd>适用于电脑屏幕。（通常也适用于不支持其她媒体类别的设备。）</dd>
                        <dt>handheld</dt>
                        <dd>仅在移动设备和/或小屏幕上加载。</dd>
                        <dt>speech</dt>
                        <dd>仅在屏幕阅读器上加载。</dd>
                        <dt>print</dt>
                        <dd>仅在打印页面时加载。</dd>
                        <dt>braille, embossed, projection, tty, tv</dt>
                        <dd>详见 <a href="http://www.w3.org/TR/CSS2/media.html">W3C 媒体规范</a>。</dd>
                        <dt>only screen and (max-width: 450px)</dt>
                        <dd>适用于 iPhone（否则不会加载 handheld 样式表）。</dd>
                    </dl>
                </li>
                <li>
                    <h4>仅限 IE</h4>
                    <p class="note">留空则在所有浏览器上加载界面。选择后，仅在 Internet Explorer 浏览器中加载，可添加 IE 专用覆盖样式。</p>
                    <dl>
                        <dt>IE</dt>
                        <dd>适用于任何版本的 IE 浏览器。</dd>
                        <dt>IE5, IE6, IE7, IE8, IE9</dt>
                        <dd>仅适用于对应版本的 IE 浏览器。</dd>
                        <dt>IE8_or_lower</dt>
                        <dd>适用于 IE8 及以下版本。</dd>
                    </dl>
                </li>
            </ul>
            <h4>与母级界面交互</h4>
            <p>如果您同时使用母级界面，可为特定母级设置条件，然后创建针对不同浏览器表现不同的界面。例如，您可将大部分 CSS 放在一个母级界面，将 IE 专用样式放在另一个母级界面，将 handheld 媒体样式放在第三个母级界面，将 print 媒体样式放在第四个母级界面。最终界面将根据用户浏览器分别加载各母级！</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面条件';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins parents”弹窗的帮助文本。
 */
function translateSkinsParentsModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins parents') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h3>界面母级</h3>
            <p>您可以通过将一个站点界面设为另一个的母级来组合和分层多个站点界面。母级界面按顺序加载，以便按该顺序显示所有界面样式。要了解有关界面更多信息，请参阅<a href="/faq/skins-and-archive-interface">界面与界面常见问题</a>。</p>
            <p>默认情况下，界面将在 Archive 默认样式之后加载。如果您不想如此，可以在“作用方式”菜单中指定将您的界面替换而不是添加到 Archive 默认样式。</p>
            <h4>加载 Archive 样式组件</h4>
            <p>如果您创建了替换界面，可能希望将组成当前默认 Archive 站点的所有界面作为母级一并加载。此选项仅在您从“作用方式”菜单中选择“完全替换 Archive 样式”时可用。之后，您可以编辑您的界面并删除不需要的部分。如果您要保留大部分内容，这将更容易操作，因为默认界面数量众多！</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面母级';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins wizard font”弹窗的帮助文本。
 */
function translateSkinsWizardFontModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins wizard font') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <p>默认值为：<code>'Lucida Grande'、'Lucida Sans Unicode'、Verdana、Helvetica、sans-serif、'GNU Unifont'</code></p>
            <p>在此处输入任意字体名称，如果它已安装在您的计算机上，则可使用。如果您使用多种设备，请指定一些备用字体，名称之间用逗号分隔，以防某设备没有首选字体。</p>
            <p>对于含有空格的字体名称，可使用单引号或双引号括起，例如 <kbd>"Lucida Grande"</kbd> 或 <kbd>'Lucida Sans Unicode'</kbd>。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面向导 字体';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins wizard font size”弹窗的帮助文本。
 */
function translateSkinsWizardFontSizeModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins wizard font size') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <p>默认值为：<code>100%</code></p>
            <p>Archive 上的字体大小基于浏览器默认字体大小的百分比。使用小于 100 的数字可缩小 Archive 文本，使用大于 100 的数字可放大文本。输入 100 可保持 Archive 的默认字体大小。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面向导 字体大小';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins wizard vertical gap”弹窗的帮助文本。
 */
function translateSkinsWizardVerticalGapModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins wizard vertical gap') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <p>默认值为：<code>1.1286em</code></p>
            <p>在此处输入任意数字，该数字将作为作品字体大小的倍数生效。数字越大，段落垂直间距越宽。</p>
            <p>例如，大多数用户以 15 像素的字体大小查看作品。输入 <kbd>2</kbd> 将生成 30 像素的垂直间距，输入 <kbd>0.5</kbd> 则会产生约 8 像素的垂直间距。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面向导 垂直间距';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“Skins wizard accent color”弹窗的帮助文本。
 */
function translateSkinsWizardAccentColorModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Skins wizard accent color') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <p>默认值为：<code>#ddd</code></p>
            <p>替换 Archive 中多个位置使用的灰色，包括表单背景、主导航中的下拉菜单，以及个人中心页面的“同人圈”和“最近作品”部分。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '界面向导 强调色';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用于翻译“合集名称”帮助弹窗
 */
function translateCollectionNameHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Collection name') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>合集名称</h4>
            <p>合集名称可以在以后更改，但这样会破坏指向该合集的链接。</p>
            <p>名称只能由 ASCII 字母（a-z、A-Z）、数字和下划线组成，且不能包含空格。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '合集名称';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 "Icon Alt Text" 弹窗。
 */
function translateIconAltTextHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const header = container?.querySelector('h4');
	if (!header || header.textContent !== 'Icon Alt Text') {
		return;
	}
	container.innerHTML = `
        <h4>图标替代文本</h4>
        <p>替代文本的作用是在图像无法显示时解释其含义。该功能供关闭图像显示或使用屏幕阅读器的视障用户使用。请勿将替代文本用于标注图片来源！</p>
        <p>例如，AO3 标志的替代文本为：“Archive of Our Own”。</p>
    `;
	container.setAttribute('data-translated-by-custom-function', 'true');
	const footer = container.nextElementSibling;
	if (footer) {
		const footerTitle = footer.querySelector('span.title');
		if (footerTitle) {
			footerTitle.textContent = '图标替代文本';
		}

		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}
}

/**
 * 专用于翻译“笔名图标注释”帮助弹窗
 */
function translatePseudIconCommentHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Pseud icon comment') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <p>您可以在此处填写关于您的图标的额外信息，例如图标制作者的署名。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '笔名图标注释文本';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用于翻译“审核制合集”帮助弹窗
 */
function translateCollectionModeratedHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Collection moderated') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>审核制合集</h4>
            <p>默认情况下，合集非审核制，这意味着任何注册用户都可以将其作品添加到合集。合集的所有者/管理员仍可在作品发布后拒绝不适当的作品。</p>
            <p>如果您将合集设置为审核制，所有注册用户仍可发布作品，但在获得管理员或所有者批准之前，作品不会出现在合集内。认证成员投稿将自动通过审核（无需人工操作）。</p>
            <p>合集的所有者可编辑合集偏好和数据，也可完全删除合集。合集的管理员可批准/邀请成员并添加或拒绝作品。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '合集审核制';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用于翻译“关闭的合集”帮助弹窗
 */
function translateCollectionClosedHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Collection closed') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>关闭的合集</h4>
            <p>一旦合集关闭，除维护者（所有者和管理员）外，无法再添加作品或书签。如果这是赠文交换或其她活动，请注意，这不会自动根据您在活动设置中设定的任何截止日期触发，必须在此手动设置。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '合集已关闭';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译 /tags/search 页面上“标签搜索结果”帮助文本。
 */
function translateTagSearchResultsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Tag search results help') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>标签搜索结果</h4>
            <p><span class="canonical">高亮</span>标签为规范标签。</p>
            <p>最新标签将显示在列表顶部。其余标签按类型和名称字母顺序排序。</p>
            <p>如果标签过多，请尝试优化搜索，而不是翻页浏览结果。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '标签搜索:结果 帮助';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译挑战注册页面上“选择任意”的帮助弹窗。
 */
function translateChallengeAnyTips() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Challenge any') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>选择“任意”</h4>
            <p>如果您在报名时为某个字段选择“任意”，即表示您同意在该字段上进行无条件匹配——此操作存在潜在风险！请务必确保您真正接受任意内容！即使您在该字段填写了具体选项，“任意”也将覆盖所有已填写内容。</p>
            <h5>示例</h5>
            <p>提供“任意”：</p>
            <ul>
                <li>您承诺为同人圈“Twin Peaks”提供作品，并为关系字段选择“任意”。</li>
                <li>用户 Mary Sue 请求创作同人圈“Twin Peaks”，并在关系字段选择“Log Lady/Llama”。</li>
                <li>您将被匹配，并需创作关于 Llama 和 Log Lady 的史诗般的爱情故事。</li>
            </ul>
            <p>请求“任意”（此情况常易混淆！）：</p>
            <ul>
                <li>用户 Mary Sue 承诺为同人圈“Twin Peaks”提供作品，并在关系字段选择“Log Lady/Llama”。</li>
                <li>您请求创作同人圈“Twin Peaks”，并为关系字段选择“任意”。</li>
                <li>Mary Sue 可能会被分配到您的请求，<strong>且只会为您创作</strong>关于 Log Lady 和 Llama 的史诗故事。</li>
            </ul>
            <p>挑战活动管理员可能会选择仅允许在“提供”中使用“任意”选项，或仅开放特定字段使用。</p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '挑战活动 任意';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译挑战注册页面上“可选标签”的帮助弹窗。
 */
function translateOptionalTagsHelp() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');
	if (!footerTitle || footerTitle.textContent !== 'Challenge optional tags user') {
		return;
	}
	if (container) {
		container.innerHTML = `
            <h4>可选标签</h4>
            <p>
            管理员将使用可选标签尝试优化匹配，但必要时可能完全忽略这些标签以完成匹配。此处适合添加冷门或特定标签。
            请注意：您添加的标签越多，可选标签被忽略的可能性越大，且匹配运行速度越慢，因此请谨慎添加！
            </p>
        `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}
	footerTitle.textContent = '挑战活动可选标签 用户';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专门用于翻译“章节标题”帮助弹窗。
 */
function translateChapterTitleHelpModal() {
	const container = document.querySelector('#modal div.content.userstuff');
	const footer = container?.nextElementSibling;
	const footerTitle = footer?.querySelector('span.title');

	if (!footerTitle || footerTitle.textContent !== 'Chapter title') {
		return;
	}

	if (container) {
		container.innerHTML = `
                <h4>章节标题</h4>
                <p>您可以为章节添加标题，但这不是必填项。</p>
            `;
		container.setAttribute('data-translated-by-custom-function', 'true');
	}

	footerTitle.textContent = '章节标题';
	const closeButton = footer.querySelector('a.modal-closer');
	if (closeButton) {
		closeButton.textContent = '关闭';
	}
}

/**
 * 专用翻译函数：翻译“关于 OTW”页面
 */
function translateAboutPage() {
	const mainDiv = document.querySelector('div#main.about');
	if (!mainDiv) return;
	const titleElement = mainDiv.querySelector('h2.heading');
	if (!titleElement || !titleElement.textContent.includes('About the OTW')) {
		return;
	}
	mainDiv.innerHTML = `
        <h2 class="heading">关于 OTW</h2>
        <div class="userstuff">
            <p>再创作组织（OTW）是一个由同人爱好者于 2007 年创立的非营利组织，旨在通过提供多种形式的同人作品和同人文化的访问权限并保存其历史，来服务同人爱好者的利益。我们相信，同人作品具有再创作性，而再创作作品具有合法地位。</p>
            <p>我们积极且富有创新精神，致力于保护和捍卫我们的作品免受商业剥削和法律挑战。我们通过保护和培育同人爱好者社群、作品、评论、历史及身份认同，同时为所有同人爱好者提供尽可能广泛的同人活动参与途径，从而维护我们的同人经济、价值观和创作表达。</p>
            <p>Archive of Our Own 采用开源归档技术，为同人作品提供一个非商业、非营利的集中托管平台。欢迎您为我们的 <a href="https://github.com/otwcode/otwarchive">GitHub 代码库</a>做出贡献，相关开放任务清单可在我们的 <a href="https://otwarchive.atlassian.net/browse/AO3">Jira 项目</a>页面查阅。</p>
            <p>我们的其她主要项目包括：</p>
            <ul>
                <li><a href="https://fanlore.org">Fanlore</a>：一个致力于保存再创作同人作品及其衍生同人圈历史的同人维基。</li>
                <li><a href="https://transformativeworks.org/projects/legal">Legal Advocacy</a>：法律倡导，致力于保护同人作品免受商业剥削和法律挑战，并为其进行辩护。</li>
                <li><a href="https://opendoors.transformativeworks.org">Open Doors</a>：为面临风险的同人项目提供庇护。</li>
                <li><a href="https://journal.transformativeworks.org/index.php/twc">Transformative Works and Cultures</a>：再创作作品与文化，一份经同行评审的学术期刊，旨在促进有关同人作品及其实践的学术研究。</li>
            </ul>
            <p>您可通过官网 <a href="https://www.transformativeworks.org">transformativeworks.org</a> 了解更多关于 OTW 及其项目的信息，也可以在<a href="https://www.transformativeworks.org/faq">常见问题页面</a>上了解您的资助对 OTW 持续发展和扩展的重要性。如果您有媒体或研究方面的问题，请联系<a href="https://www.transformativeworks.org/contact_us/">通讯团队</a>。</p>
        </div>
    `;
	mainDiv.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用翻译函数：翻译“捐赠”页面
 */
function translateDonatePage() {
	const mainDiv = document.querySelector('div#main.donate');
	if (!mainDiv) return;
	const titleElement = mainDiv.querySelector('h2.heading');
	if (!titleElement || !titleElement.textContent.includes('Donations')) {
		return;
	}
	mainDiv.innerHTML = `
        <h2 class="heading">捐赠</h2>
        <h3 class="heading">支持 AO3 主要有两种方式：捐赠您的时间或资金。</h3>
        <div class="userstuff">
            <h3>捐赠时间</h3>
            <p>
                <a href="https://www.transformativeworks.org">再创作组织（OTW）</a>是 Archive of Our Own（AO3）的上级组织。我们持续招募志愿者参与<a href="https://www.transformativeworks.org/our-projects">项目开发</a>。若您有意为 AO3 提供志愿服务，可关注以下委员会：无障碍、设计与技术委员会（AD&T）；AO3 文档委员会；政策与滥用委员会；支持团队；标签管理委员会；以及翻译委员会。
            </p>
            <p>
                同时诚邀您为我们的 <a href="https://github.com/otwcode/otwarchive">GitHub 代码库</a>贡献代码，开放任务详见 <a href="https://otwarchive.atlassian.net/browse/AO3">Jira 项目</a>。欢迎浏览我们的<a href="https://www.transformativeworks.org/volunteer">志愿者职位列表</a>，<a href="https://www.transformativeworks.org/you-can-now-subscribe-to-otw-news-by-email">订阅邮件</a>以获取含志愿者招募的全面资讯，并申请符合您资历和兴趣的任何志愿者职位。
            </p>
            <h3>捐赠资金</h3>
            <p>
                AO3 的日常运营需要持续支出——服务器的电力和带宽——以及随着用户和作品数量的增加，不时购买新服务器等一次性支出。任何<a href="https://donate.transformativeworks.org/otwgive">向 OTW 的捐赠</a>都至关重要。（请放心，我们绝不会将您的 AO3 用户名与财务信息关联。）
            </p>
        </div>
    `;
	mainDiv.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用翻译函数：翻译“多元化声明”页面
 */
function translateDiversityStatement() {
	const mainDiv = document.querySelector('div#main.diversity');
	if (!mainDiv) {
		return;
	}
	const titleElement = mainDiv.querySelector('h2.heading');
	if (!titleElement || !titleElement.textContent.includes('You are welcome at the Archive of Our Own.')) {
		return;
	}
	mainDiv.innerHTML = `
        <h2 class="heading">欢迎来到 Archive of Our Own 。</h2>
        <div class="userstuff">
            <p>无论您的外表、境遇、立场或世界观如何：只要您喜欢欣赏、创作或评论同人作品，AO3 即为您而建。</p>
            <p>本站是一个由同人爱好者为同人爱好者打造的永久性全同人圈作品托管平台。无论您以何种方式使用本站，您都是其中的一份子，通过您的使用和<a href="/support">反馈</a>为其注入活力并塑造未来。</p>
            <p>我们——<a href="/admin_posts">AO3 团队</a>——深知无法在初次尝试时就尽善尽美，也无法让所有人都满意。但我们会努力寻求平衡，郑重考虑并认真对待您的每一条反馈。</p>
            <p>您可以自由发挥创意，但必须遵守一些<a href="/content">必要的限制</a>，以便为其她用户提供可行性服务。本站致力于保护您的自由表达权及隐私权；详情请阅读我们的<a href="/tos">服务条款</a>。</p>
            <p>我们明白，要让 AO3 真正实现全同人圈愿景，仍需完善<a href="/admin_posts/295">关键功能</a>：如托管文本形式以外的同人作品、提供多语言界面、增加用户互动方式等。但有了您的支持，我们终将实现目标。</p>
            <p>我们之所以构建这座档案馆，是因为我们相信持不同观点与主张的人可以齐聚一堂，彼此分享。</p>
            <p>我们为您而建，期待您成为其中的一员。</p>
            <br>
            <p>本文是对 <a href="http://www.dreamwidth.org">Dreamwidth</a> <a href="http://www.dreamwidth.org/legal/diversity">多元化声明</a>的再创作。</p>
            <p>
                <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/3.0/88x31.png"></a>
                <br>
                本作品采用<a href="http://creativecommons.org/licenses/by-sa/3.0/">知识共享署名-相同方式共享 3.0 未本地化版本</a>许可协议进行许可。
            </p>
        </div>
    `;
	mainDiv.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专门用于翻译服务条款（TOS）同意提示弹窗。
 */
function translateTOSPrompt() {
	const promptDiv = document.querySelector('div#tos_prompt');
	if (!promptDiv || promptDiv.hasAttribute('data-translated-by-custom-function')) {
		return;
	}
	const h2Span = promptDiv.querySelector('h2.heading span');
	if (h2Span) {
		h2Span.textContent = 'Archive of Our Own';
	}
	const firstP = promptDiv.querySelector('.agreement p:first-of-type');
	if (firstP) {
		firstP.innerHTML = '在 Archive of Our Own（AO3）上，用户可以创建作品、书签、评论、标签及其她<a href="/tos_faq#define_content">内容</a>。您在 AO3 发布的任何信息均可能对公众、AO3 用户及 AO3 工作人员可见。请谨慎分享个人信息，包括但不限于您的姓名、电子邮箱、年龄、所在地、个人关系、性别或性取向、种族或民族背景、宗教或政治观点及其她网站的账户用户名。';
	}
	const secondP = promptDiv.querySelector('.agreement p:nth-of-type(2)');
	if (secondP) {
		secondP.innerHTML = '想了解更多信息，请查看我们的<a href="/tos">服务条款</a>（包括<a href="/content">内容政策</a>和<a href="/privacy">隐私政策</a>）。';
	}
	const tosLabel = promptDiv.querySelector('label[for="tos_agree"]');
	if (tosLabel) {
		const originalText = tosLabel.textContent;
		const yearMatch = originalText.match(/(\d{4})/);
		if (yearMatch && originalText.includes('I have read & understood the')) {
			const year = yearMatch[1];
			tosLabel.textContent = `我已阅读并理解 ${year} 年服务条款，包括内容政策和隐私政策。`;
		}
	}
	const dataLabel = promptDiv.querySelector('label[for="data_processing_agree"]');
	if (dataLabel) {
		dataLabel.textContent = '勾选此项即表示您同意在美国及其她司法管辖区为向您提供 AO3 及其相关服务而处理您的个人数据。您确认该司法管辖区的数据隐私法律可能与您所在司法管辖区存在差异。有关您的个人数据将如何被处理的更多信息，请参阅我们的隐私政策。';
	}
	const button = promptDiv.querySelector('button#accept_tos');
	if (button) {
		button.textContent = '我同意/认可上述条款';
	}
	promptDiv.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 翻译各种操作按钮
 */
function translateActionButtons() {
	// Please wait 状态按钮
	const buttonsToTranslateDisableText = document.querySelectorAll('[data-disable-with="Please wait..."]');
	buttonsToTranslateDisableText.forEach(button => {
		button.setAttribute('data-disable-with', '请稍等…');
	});
	// 订阅/取消订阅按钮
	const subscribeButton = document.querySelector('input[name="commit"][value="Subscribe"]');
	if (subscribeButton) {
		subscribeButton.value = '订阅';
	}

	const unsubscribeButton = document.querySelector('input[name="commit"][value="Unsubscribe"]');
	if (unsubscribeButton) {
		unsubscribeButton.value = '取消订阅';
	}
	// 收藏标签/取消收藏按钮
	const favoriteTagButton = document.querySelector('input[name="commit"][value="Favorite Tag"]');
	if (favoriteTagButton) {
		favoriteTagButton.value = '收藏标签';
	}

	const unfavoriteTagButton = document.querySelector('input[name="commit"][value="Unfavorite Tag"]');
	if (unfavoriteTagButton) {
		unfavoriteTagButton.value = '取消收藏';
	}
	const ajaxForms = document.querySelectorAll('form.ajax-create-destroy');
	ajaxForms.forEach(form => {
		// 订阅功能
		if (form.getAttribute('data-create-value') === 'Subscribe') {
			form.setAttribute('data-create-value', '订阅');
		}
		if (form.getAttribute('data-destroy-value') === 'Unsubscribe') {
			form.setAttribute('data-destroy-value', '取消订阅');
		}
		// 收藏标签功能
		if (form.getAttribute('data-create-value') === 'Favorite Tag') {
			form.setAttribute('data-create-value', '收藏标签');
		}
		if (form.getAttribute('data-destroy-value') === 'Unfavorite Tag') {
			form.setAttribute('data-destroy-value', '取消收藏');
		}
	});
}

/**
 * 专用于翻译按钮
 */
function translateSortButtons() {
	const translations = {
		'Bookmarks': '书签',
		'Comment Threads': '评论串',
		'Date': '日期',
		'Fandom': '同人圈',
		'Hits': '点击',
		'Kudos ♥': '点赞',
		'Prompter': '梗提供者',
		'Subscriptions': '订阅列表',
		'Word Count': '字数统计'
	};
	const sortButtons = document.querySelectorAll('a[title="sort up"], a[title="sort down"]');
	sortButtons.forEach(button => {
		if (button.hasAttribute('data-translated-by-custom-function')) {
			return;
		}

		let currentHTML = button.innerHTML;
		let isTranslated = false;
		for (const key in translations) {
			if (currentHTML.includes(key)) {
				currentHTML = currentHTML.replace(key, translations[key]);
				isTranslated = true;
			}
		}

		const title = button.getAttribute('title');
		if (title === 'sort up') {
			button.setAttribute('title', '升序');
			isTranslated = true;
		} else if (title === 'sort down') {
			button.setAttribute('title', '降序');
			isTranslated = true;
		}

		if (isTranslated) {
			button.innerHTML = currentHTML;
			button.setAttribute('data-translated-by-custom-function', 'true');
		}
	});
}

/**
 * 专用于翻译 /tag_sets 页面上带有“?”弹窗链接的标题。
 */
function translateTagSetsHeading() {
	const h2 = document.querySelector('h2.heading:has(a[href="/help/tagset-about.html"])');
	if (!h2 || h2.hasAttribute('data-translated-by-custom-function')) {
		return;
	}
	if (h2.firstChild && h2.firstChild.nodeType === Node.TEXT_NODE) {
		h2.firstChild.nodeValue = ' AO3 中的标签集 ';
	}
	if (h2.lastChild && h2.lastChild.nodeType === Node.TEXT_NODE) {
		h2.lastChild.nodeValue = '';
	}
	h2.setAttribute('data-translated-by-custom-function', 'true');
}

/**
 * 专用于翻译搜索结果页面上带有“?”弹窗链接的“找到”标题。
 */
function translateFoundResultsHeading() {
	const h3s = document.querySelectorAll('h3.heading:has(a[href*="-search-results-help.html"])');
	h3s.forEach(h3 => {
		if (h3.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		const textNode = h3.firstChild;
		if (textNode && textNode.nodeType === Node.TEXT_NODE) {
			const match = textNode.nodeValue.match(/\s*([\d,]+)\s+Found\s*/);
			if (match) {
				const number = match[1];
				textNode.nodeValue = `找到 ${number} 条结果 `;
			}
		}
		h3.setAttribute('data-translated-by-custom-function', 'true');
	});
}

/**
 * 专门用于翻译作品与书签搜索结果页面上的 H4 标题。
 */
function translateSearchResultsHeader() {
	const h4 = document.querySelector('h2.heading + h4.heading');

	if (!h4 || h4.hasAttribute('data-translated-by-custom-function')) {
		return;
	}
	const originalText = h4.textContent.trim();
	// 翻译字典
	const translations = {
		'title': '标题',
		'author/artist': '作者/画师',
		'tags': '标签',
		'fandoms': '同人圈',
		'rating': '分级',
		'archive warnings': 'Archive 预警',
		'categories': '分类',
		'characters': '角色',
		'relationships': '关系',
		'language': '语言',
		'word count': '字数',
		'hits': '点击',
		'kudos count': '点赞数',
		'comments count': '评论数',
		'bookmarks count': '书签数',
		'revised at': '更新于',
		'sort by': '排序方式',
		'bookmarker': '书签创建者',
		'notes': '注释',
		'type': '类型',
		'work language': '作品语言',
		'date bookmarked': '书签创建日期',
		'date updated': '更新日期',

		'general audiences': '全年龄',
		'teen and up audiences': '青少年及以上',
		'mature': '成人向',
		'explicit': '限制级',
		'not rated': '未分级',
		'creator chose not to use archive warnings': '不使用 Archive 预警',
		'no archive warnings apply': 'Archive 预警不适用',
		'graphic depictions of violence': '暴力场景描写',
		'major character death': '主要角色死亡',
		'rape/non-con': '强暴/非自愿性行为',
		'underage sex': '未成年性行为',
		'f/f': '女/女',
		'f/m': '女/男',
		'm/m': '男/男',
		'gen': '无CP',
		'multi': '多配对',
		'other': '其她',
		'work': '作品',
		'series': '系列',
		'external work': '外部作品',
		'rec': '推荐',
		'with notes': '含注释',
		'complete': '已完结',
		'Complete': '已完结',
		'in progress': '连载中',
		'incomplete': '连载中',
		'no crossovers': '排除跨圈作品',
		'only crossovers': '仅限跨圈作品',
		'single chapter': '单个章节',

		'best match': '最佳匹配',
		'author': '作者',
		'date posted': '发布日期',
		'kudos': '点赞',
		'comments': '评论',
		'bookmarks': '书签',

		'descending': '降序',
		'ascending': '升序',
	};

	const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
	const translationRegex = new RegExp(`\\b(${translationKeys.join('|').replace(/\//g, '\\/')})\\b`, 'gi');

	let processedText = originalText.replace(translationRegex, (match) => {
		return translations[match.toLowerCase()] || match;
	});

	processedText = processedText.replace(/(排序方式：)\s*(.+?)\s*(升序|降序)\s*$/g, '$1$2（$3）');
	processedText = processedText
		.replace(/You searched for:/i, '您搜索了：')
		.replace(/\s*:\s*/g, '：')
		.replace(/, /g, '，')
		.replace(/，/g, '，')
		.replace(/ \/ /g, '/')
		.replace(/\s*：\s*/g, '：')
		.replace(/\s*，\s*/g, '，')
		.replace(/：，/g, '：')
		.replace(/^您搜索了：，/, '您搜索了：')
		.trim();

	h4.textContent = processedText;
	h4.setAttribute('data-translated-by-custom-function', 'true');

	const subnavLink = document.querySelector('ul.navigation.actions a[href*="edit_search=true"]');
	if (subnavLink) {
		subnavLink.textContent = '修改搜索设置';
	}

	const noResultsP = Array.from(document.querySelectorAll('#main > p')).find(p => p.textContent.includes('No results found.'));
	if (noResultsP) {
		noResultsP.textContent = '未找到结果。您可以尝试修改搜索设置，使其不那么精确。';
	}
}

/**
 * 翻译 flash notice 提示消息
 */
function translateFlashMessages() {
	document.querySelectorAll('div.flash.notice').forEach(flash => {
		const originalHTML = flash.innerHTML;
		const originalText = flash.textContent;

		let newHTML = originalHTML;

		const subscribeMatch = originalHTML.match(/^You are now following (.+?)\. If you'd like to stop receiving email updates, you can unsubscribe from (<a href=".*?">your Subscriptions page<\/a>)\.$/);
		if (subscribeMatch) {
			const workTitle = subscribeMatch[1];
			const linkTag = subscribeMatch[2].replace('>your Subscriptions page<', '>订阅列表<');
			newHTML = `您已订阅 ${workTitle} 。如果您想停止接收邮件更新提醒，可以在${linkTag}页面取消订阅。`;
		}
		else {
			const unsubscribeMatch = originalHTML.match(/^You have successfully unsubscribed from (.+?)\.$/);
			if (unsubscribeMatch) {
				const workTitle = unsubscribeMatch[1];
				newHTML = `您已成功取消对 ${workTitle} 的订阅。`;
			}
		}
		if (originalText.startsWith('You have successfully removed')) {
			const match = originalText.match(/You have successfully removed (.+?) from your favorite tags\./);
			if (match && match[1]) {
				newHTML = `您已成功将 ${match[1].trim()} 从收藏的标签中移除。`;
			}
		}
		else if (originalHTML.startsWith('You have successfully added')) {
			const match = originalHTML.match(/^You have successfully added (.+?) to your favorite tags\. You can find them on the <a href="\/">Archive homepage<\/a>\.$/);
			if (match && match[1]) {
				newHTML = `您已成功将 ${match[1].trim()} 添加到收藏标签列表。您可以在 <a href="/">Archive 首页</a>上找到它们。`;
			}
		}
		if (newHTML !== originalHTML) {
			flash.innerHTML = newHTML;
		}
	});
}

/**
 * 翻译点赞区域
 */
function translateKudosSection() {
	const kudosDiv = document.getElementById('kudos');
	if (!kudosDiv || kudosDiv.dataset.kudosObserverAttached === 'true') {
		return;
	}
	const translateParagraphContent = (pElement) => {
		let html = pElement.innerHTML;
		const originalHtml = html;
		html = html.replace(/(<a[^>]*>)([\d,]+)\s+more\s+users(<\/a>)/g, '$1$2 位用户$3');
		html = html.replace(/([\d,]+)\s+guest(s)?/g, '$1 位访客');
		html = html.replace(/\s+as well as\s+/g, ' ，以及 ');
		html = html.replace(/(<span id="kudos_more_connector">), and (<\/span>)/g, '$1，和 $2');
		html = html.replace(/\s+and\s+/g, ' 和 ');
		html = html.replace(/, /g, '，');
		html = html.replace(/\s+left kudos on this work!/g, '点赞了此作品！');

		if (html !== originalHtml) {
			pElement.innerHTML = html;
		}
	};
	const observer = new MutationObserver(() => {
		const currentP = kudosDiv.querySelector('p.kudos');
		if (currentP) {
			translateParagraphContent(currentP);
		}
	});
	observer.observe(kudosDiv, {
		childList: true,
		subtree: true
	});
	kudosDiv.dataset.kudosObserverAttached = 'true';
	const initialP = kudosDiv.querySelector('p.kudos');
	if (initialP) {
		translateParagraphContent(initialP);
	}
}

/**
 * 翻译统计图表
 */
function translateStatsChart() {
	const chartContainer = document.getElementById('stat_chart');
	if (!chartContainer || chartContainer.dataset.chartObserverAttached === 'true') {
		return;
	}

	const translateSVGText = (svg) => {
		const textElements = svg.querySelectorAll('text');
		if (textElements.length === 0) {
			return false;
		}

		const translations = {
			'Hits': '点击量',
			'Kudos': '点赞数',
			'Comment Threads': '评论串',
			'Comment Thread Count': '评论串数',
			'Bookmarks': '书签',
			'Subscriptions': '订阅列表',
			'Word Count': '字数',
			'Most Recent': '最近发布',
			'Oldest': '最早发布'
		};

		const titleRegex = /^(Top|Bottom) Five By (.+)$/;
		let wordCountElements = [];

		textElements.forEach(textEl => {
			const originalText = textEl.textContent.trim();
			if (!originalText) return;

			if (originalText === 'Word') {
				wordCountElements.push(textEl);
				return;
			}

			if (wordCountElements.length > 0) {
				const cleanedCountText = originalText.replace(/\u2026|\.\.\.$/, '');
				if ('Count'.startsWith(cleanedCountText)) {
					const wordEl = wordCountElements.pop();
					const wordY = parseFloat(wordEl.getAttribute('y'));
					const countY = parseFloat(textEl.getAttribute('y'));
					if (Math.abs(wordY - countY) < 20) {
						wordEl.textContent = '字数';
						textEl.textContent = '';
					}
					return;
				}
			}

			const titleMatch = originalText.match(titleRegex);
			if (titleMatch) {
				const direction = titleMatch[1] === 'Top' ? '前五' : '后五';
				const categoryKey = titleMatch[2];
				const category = translations[categoryKey] || categoryKey;
				textEl.textContent = `按${category}排名${direction}`;
				return;
			}

			if (translations[originalText]) {
				textEl.textContent = translations[originalText];
				return;
			}

			const cleanedText = originalText.replace(/\u2026|\.\.\.$/, '');
			if (cleanedText === '') {
				return;
			}

			if (cleanedText !== originalText) {
				for (const fullWord in translations) {
					if (fullWord.startsWith(cleanedText)) {
						textEl.textContent = translations[fullWord];
						return;
					}
				}
			}
		});
		return true;
	};

	const observer = new MutationObserver((mutationsList, obs) => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
				const svg = chartContainer.querySelector('svg');
				if (svg) {
					if (translateSVGText(svg)) {
						obs.disconnect();
						return;
					}
				}
			}
		}
	});

	observer.observe(chartContainer, { childList: true, subtree: true });
	chartContainer.dataset.chartObserverAttached = 'true';

	const initialSvg = chartContainer.querySelector('svg');
	if (initialSvg) {
		if (translateSVGText(initialSvg)) {
			observer.disconnect();
		}
	}
}


/**************************************************************************
 * I18N 翻译数据区
 **************************************************************************/

const I18N = {
	'conf': {
		ignoreMutationSelectorPage: {
			'*': ['.userstuff .revised.at', '.kudos_count', '.bookmark_count', '.comment_count', '.hit_count', '.view_count'],
			'works_show': ['.stats .hits', '.stats .kudos'],
		},
		ignoreSelectorPage: {
			'*': ['script', 'style', 'noscript', 'iframe', 'canvas', 'video', 'audio', 'img', 'svg', 'pre', 'code', '.userstuff.workskin', '.workskin', 'div.autocomplete.dropdown ul', 'dd.freeform.tags', '[data-translated-by-custom-function]', 'li.freeforms', 'blockquote.userstuff.summary', 'textarea#embed_code', '.header.module h4.heading a[href^="/series/"]', '.header.module h4.heading a[href^="/works/"]', '.header.module h4.heading a[rel="author"]', '.header.module h5.fandoms a.tag', 'ul.series a[href^="/series/"]', 'dd.series a[href^="/series/"]'],
			'works_show': ['.dropdown.actions-menu ul', '#main .userstuff'],
			'works_chapters_show': ['#main .userstuff'],
			'series_show': ['h2.heading'],
			'admin_posts_show': ['.userstuff'],
			'tag_sets_index': ['h2.heading', 'dl.stats'],
			'tag_sets_new': ['h4.heading > label[for*="freeform"]'],
			'faq_page': ['.userstuff', '.faq.index.group'],
			'wrangling_guidelines_page': ['.userstuff'],
			'tos_page': ['#tos.userstuff'],
			'content_policy_page': ['#content.userstuff'],
			'privacy_policy_page': ['#privacy.userstuff'],
			'dmca_policy_page': ['#DMCA.userstuff'],
			'tos_faq_page': ['.admin.userstuff'],
			'abuse_reports_new': ['.userstuff'],
			'support_page': ['.userstuff'],
			'known_issues_page': ['.admin.userstuff'],
			'report_and_support_page': ['.userstuff'],
		},
		characterDataPage: ['common', 'works_show', 'users_dashboard'],
		rePagePath: /^\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/
	},
	'zh-CN': {
		'title': {
			'static': {},
			'regexp': []
		},
		'public': {
			'static': {

				// 基本
				'Archive of Our Own': 'AO3 作品库',
				'Fandoms': '同人圈', 'All Fandoms': '所有同人圈',
				'Browse': '浏览', 'Works': '作品', 'Bookmarks': '书签', 'Tags': '标签', 'Collection': '合集', 'Collections': '合集',
				'Search': '搜索', 'People': '用户',
				'About': '关于', 'About Us': '关于我们', 'News': '新的动态', 'FAQ': '常见问题', 'Wrangling Guidelines': '整理指南', 'Donate or Volunteer': '捐赠/志愿',
				'Recent Works': '最近作品',
				'Recent Series': '最近系列',
				'Recent Bookmarks': '最近书签', 'Collections:': '合集:',
				'Bookmarker\'s Tags:': '书签创建者的标签：', 'Bookmarker\'s Collections:': '书签创建者的合集：', 'Completed': '已完结',
				'Bookmark Tags:': '书签标签：', 'Complete Work': '已完结', 'Work in Progress': '连载中', 'Public Bookmark': '公开书签',
				'Most Popular': '最常用', 'Tag Sets': '标签集',
				'Warnings': '预警',
				'Find your favorites': '寻找喜欢的内容',

				// 登录
				'Log In': '登录',
				'Log in': '登录',
				'Sign Up': '注册',
				'User': '用户',
				'Username or email:': '用户名或邮箱:',
				'Password:': '密码:',
				'Remember Me': '记住我',
				'Remember me': '记住我',
				'Forgot password?': '忘记密码?',
				'Get an Invitation': '获取邀请',

				// 忘记密码
				'Forgotten your password?': '忘记您的密码了吗？',
				'If you\'ve forgotten your password, we can send instructions that will allow you to reset it. Please tell us the username or email address you used when you signed up for your Archive account.': '如果您忘记了密码，我们可以发送允许您重置密码的邮件说明。请输入您注册 AO3 帐户时使用的用户名或电子邮箱地址。',
				'Reset Password': '重置密码',

				// 星期
				'Mon': '周一',
				'Tue': '周二',
				'Wed': '周三',
				'Thu': '周四',
				'Fri': '周五',
				'Sat': '周六',
				'Sun': '周日',
				'Monday': '星期一',
				'Tuesday': '星期二',
				'Wednesday': '星期三',
				'Thursday': '星期四',
				'Friday': '星期五',
				'Saturday': '星期六',
				'Sunday': '星期日',

				// 月份
				'Jan': '1月',
				'Feb': '2月',
				'Mar': '3月',
				'Apr': '4月',
				'May': '5月',
				'Jun': '6月',
				'Jul': '7月',
				'Aug': '8月',
				'Sep': '9月',
				'Oct': '10月',
				'Nov': '11月',
				'Dec': '12月',
				'January': '1月',
				'February': '2月',
				'March': '3月',
				'April': '4月',
				'May': '5月',
				'June': '6月',
				'July': '7月',
				'August': '8月',
				'September': '9月',
				'October': '10月',
				'November': '11月',
				'December': '12月',

				// 页脚
				'Footer': '页脚',
				'Customize': '自定义',
				'Default': '默认界面',
				'Low Vision Default': '低视力默认界面',
				'Reversi': 'Reversi 界面',
				'Snow Blue': 'Snow Blue 界面',
				'About the Archive': '关于 Archive',
				'Site Map': '站点地图',
				'Diversity Statement': '多元化声明',
				'Terms of Service': '服务条款',
				'Content Policy': '内容政策',
				'Privacy Policy': '隐私政策',
				'DMCA Policy': 'DMCA 政策',
				'Site Status': '站点状态',
				'TOS FAQ': '服务条款常见问题',
				'↑ Top': '↑ 回到顶部',
				'Frequently Asked Questions': '常见问题',
				'Contact Us': '联系我们',
				'Policy Questions & Abuse Reports': '政策咨询与滥用举报',
				'Technical Support & Feedback': '技术支持与反馈',
				'Development': '开发',
				'Known Issues': '已知问题',
				'View License': '查看许可证',
				'OTW': 'OTW',
				'Organization for Transformative Works': '再创作组织',

				// 反馈
				'Support and Feedback': '支持与反馈',
				'FAQs & Tutorials': '常见问题与教程',
				'Release Notes': '更新日志',

				// 动态
				'News': '最新动态',
				'All News': '全部动态',
				'Published': '发布于',
				'Comments': '评论',
				'Read more...': '更多',
				'Tag:': '标签：',
				'Go': '确定',
				'RSS Feed': 'RSS 订阅',
				'Follow us': '关注我们',
				'What\'s New': '新增内容',
				'Enter Comment': '输入评论',
				'Last Edited': '最后编辑',

				// 同人圈
				'Anime & Manga': '动漫及漫画', 'Books & Literature': '书籍及文学', 'Cartoons & Comics & Graphic Novels': '卡通，漫画及图像小说', 'Celebrities & Real People': '明星及真人', 'Movies': '电影', 'Music & Bands': '音乐及乐队', 'Other Media': '其她媒体', 'Theater': '戏剧', 'TV Shows': '电视剧', 'Video Games': '电子游戏', 'Uncategorized Fandoms': '未分类的同人圈',
				'> Anime & Manga': ' > 动漫及漫画', '> Books & Literature': ' > 书籍及文学', '> Cartoons & Comics & Graphic Novels': ' > 卡通，漫画及图像小说', '> Celebrities & Real People': ' > 明星及真人', '> Movies': ' > 电影', '> Music & Bands': ' > 音乐及乐队', '> Other Media': ' > 其她媒体', '> Theater': ' > 戏剧', '> TV Shows': ' > 电视剧', '> Video Games': ' > 电子游戏', '> Uncategorized Fandoms': ' > 未分类的同人圈',

				// 个人中心
				'My Dashboard': '个人中心',
				'My Subscriptions': '订阅列表',
				'My History': '历史记录',
				'My Preferences': '偏好设置',
				'Dashboard': '仪表盘',
				'Preferences': '偏好设置',
				'Skins': '站点界面',
				'Works in Collections': '合集中的作品',
				'Drafts': '草稿',
				'Please note:': '注意：',
				'Unposted drafts are only saved for a month from the day they are first created, and then deleted from the Archive.': '未发布的草稿自创建日起仅保留一个月，之后将被从 Archive 中删除。',
				'Series': '系列',
				'Bookmark External Work': '为外部作品创建书签',
				'Sorry, there were no collections found.': '抱歉，未找到任何合集。',
				'Manage Collection Items': '管理合集',
				'New Collection': '新建合集',
				'Works in Challenges/Collections': '参与挑战/合集的作品',
				'Awaiting Collection Approval': '等待合集方审核',
				'Awaiting User Approval': '等待用户确认',
				'Rejected by Collection': '合集方已拒绝',
				'Rejected by User': '用户已拒绝',
				'Approved': '已通过',
				'Nothing to review here!': '当前无待审内容！',
				'Inbox': '消息中心',
				'Filter by read': '按阅读状态筛选',
				'Show all': '显示全部',
				'Show unread': '显示未读',
				'Show read': '显示已读',
				'Filter by replied to': '按回复状态筛选',
				'Show all': '显示全部',
				'Show without replies': '显示未回复',
				'Show replied to': '显示已回复',
				'Sort by date': '按日期排序',
				'Newest first': '最新优先',
				'Oldest first': '最早优先',
				'Filter': '筛选',
				'Statistics': '数据统计',
				'History': '历史记录',
				'Full History': '全部历史记录',
				'Marked for Later': '稍后阅读',
				'Is it later already?': '到“稍后”了吗？',
				'Some works you\'ve marked for later.': '这里是您标记为稍后阅读的作品。',
				'Clear History': '清空历史记录',
				'Delete from History': '删除历史记录',
				'Subscriptions': '订阅列表',
				'All Subscriptions': '所有订阅',
				'Series Subscriptions': '系列订阅',
				'User Subscriptions': '用户订阅',
				'Work Subscriptions': '作品订阅',
				'My Series Subscriptions': '系列订阅',
				'My User Subscriptions': '用户订阅',
				'My Work Subscriptions': '作品订阅',
				'Delete All Work Subscriptions': '删除所有作品订阅',
				'Delete All Series Subscriptions': '删除所有系列订阅',
				'Delete All User Subscriptions': '删除所有用户订阅',
				'Yes, Delete All Subscriptions': '是的，删除所有订阅',
				'Yes, Delete All Work Subscriptions': '是的，删除所有作品订阅',
				'Yes, Delete All Series Subscriptions': '是的，删除所有系列订阅',
				'Yes, Delete All User Subscriptions': '是的，删除所有用户订阅',
				'Your subscriptions have been deleted.': '您的订阅已成功删除。',
				'Unsubscribe': '取消订阅',
				'Delete All Subscriptions': '删除所有订阅',
				'Sign-ups': '报名挑战',
				'Assignments': '任务中心',
				'Unfulfilled Claims': '未完成的认领',
				'Fulfilled Claims': '已完成的认领',
				'Claims': '我的认领',
				'Related Works': '相关作品',
				'Gifts': '赠文',
				'Accepted Gifts': '已接受的赠文',
				'Refused Gifts': '已拒绝的赠文',
				'Choices': '用户选项',
				'Pitch': '创作与发布',
				'Catch': '互动与追踪',
				'Switch': '活动与交换',
				'My Works': '我的作品',
				'My Series': '我的系列',
				'My Bookmarks': '我的书签',
				'My Collections': '我的合集',
				'History': '历史记录',
				'Log Out': '登出',
				'Post New': '发布新作',
				'Edit Works': '编辑作品',
				'Subscribe': '订阅',
				'Invitations': '邀请',
				'My pseuds:': '笔名：',
				'Name (required)': '名称（必填）',
				'Create Pseud': '创建笔名',
				'Edit Pseud': '编辑笔名',
				'Back To Pseuds': '返回笔名列表',
				'Pseuds': '笔名',
				'Pseud was successfully created.': '笔名已成功创建。',
				'I joined on:': '加入于：',
				'My user ID is:': '用户ID：',
				'Edit My Works': '编辑作品',
				'Edit My Profile': '编辑资料',
				'Set My Preferences': '设置偏好',
				'Manage My Pseuds': '管理笔名',
				'Delete My Account': '删除账号',
				'Blocked Users': '已屏蔽用户',
				'Muted Users': '已静音用户',
				'Change Username': '修改用户名',
				'Change Password': '修改密码',
				'Email address': '邮箱地址',
				'Change Email': '修改邮箱',
				'Privacy': '隐私设置',
				'Show my email address to other people.': '向其她人显示我的邮箱地址',
				'Show my date of birth to other people.': '向其她人显示我的出生日期',
				'Hide my work from search engines when possible.': '尽可能地对搜索引擎隐藏我的作品',
				'Hide the share buttons on my work.': '隐藏我作品中的分享按钮',
				'Allow others to invite me to be a co-creator.': '允许其她人邀请我成为共同创作者',
				'Display': '显示设置',
				'Show me adult content without checking.': '无需确认即可显示成人内容',
				'Show the whole work by default.': '默认显示全文',
				'Hide warnings (you can still choose to show them).': '隐藏内容预警（仍可手动显示）',
				'Hide additional tags (you can still choose to show them).': '隐藏附加标签（仍可手动显示）',
				'Hide work skins (you can still choose to show them).': '隐藏作品界面（仍可手动显示）',
				'Your site skin': '您的站点界面',
				'Public Site Skins': '公共站点界面',
				'Your time zone': '您所在的时区',
				'Browser page title format': '浏览页面标题格式',
				'Turn off emails about comments.': '关闭评论邮件通知',
				'Turn off messages to your inbox about comments.': '关闭评论消息通知',
				'Turn off copies of your own comments.': '关闭自己评论的副本通知',
				'Turn off emails about kudos.': '关闭点赞邮件通知',
				'Do not allow guests to reply to my comments on news posts or other users\' works (you can still control the comment settings for your works separately).': '不允许游客回复我在动态帖或其她用户作品中的评论（仍可单独调整自己作品的评论权限）',
				'Collections, Challenges and Gifts': '合集、挑战与赠文设置',
				'Allow others to invite my works to collections.': '允许其她人将我的作品加入合集',
				'Allow anyone to gift me works.': '允许任何人向我赠送作品',
				'Turn off emails from collections.': '关闭来自合集的邮件通知',
				'Turn off inbox messages from collections.': '关闭来自合集的消息通知',
				'Turn off emails about gift works.': '关闭有关赠文的邮件通知',
				'Misc': '其她偏好设置',
				'Turn on History.': '启用历史记录',
				'Turn the new user help banner back on.': '重新显示新用户帮助横幅',
				'Turn off the banner showing on every page.': '关闭每个页面的提示横幅',
				'Update': '确定',
				'My Site Skins': '我的站点界面',
				'Create Site Skin': '创建站点界面',
				'A site skin lets you change the way the Archive is presented when you are logged in to your account. You can use work skins to customize the way your own works are shown to others.': '站点界面可让您在登录账户后更改 Archive 的呈现方式。您也可以使用作品界面来自定义其她人查看您作品时的展示样式。',
				'My Site Skins': '我的站点界面',
				'My Work Skins': '我的作品界面',
				'Public Work Skins': '公共作品界面',
				'Create Work Skin': '创建作品界面',
				'No site skins here yet!': '还没有站点界面！',
				'No work skins here yet!': '还没有作品界面！',
				'Why not try making one?': '为什么不试着去创建一个呢？',
				'Inbox': '收件箱',
				'Subscribed Works': '已订阅作品',
				'Subscribed Series': '已订阅系列',
				'Unposted Assignments': '未发布的任务',
				'Completed Assignments': '已完成的任务',

				// 合集管理与设置
				'Creator/Pseud(s)': '创作者/笔名',
				'Details ↓': '详情 ↓',
				'Close Details ↑': '收起详情 ↑',
				'Bookmarker approval status': '书签创建者审核状态',
				'Unreviewed by bookmarker': '书签创建者未审核',
				'Approved by bookmarker': '书签创建者已通过',
				'Rejected by bookmarker': '书签创建者已拒绝',
				'Collection approval status': '合集审核状态',
				'Unreviewed by collection moderators': '合集管理员未审核',
				'Approved by collection moderators': '合集管理员已通过',
				'Rejected by collection moderators': '合集管理员已拒绝',
				'Remove': '移除',
				'Owner pseud(s)': '所有者笔名',
				'Collection Tags': '合集标签',
				'Enter up to 10 tags to describe the content of your collection.': '最多输入 10 个标签来描述您的合集内容。',
				'Use this if your collection is not fandom-specific.': '如果您的合集不针对特定同人圈，请使用此项。',

				// 作品搜索页
				'Work Info': '作品信息',
				'Date Posted': '发布日期',
				'Date Updated': '更新日期',
				'Completion status': '完成状态',
				'All works': '所有作品',
				'Complete works only': '仅完结作品',
				'Works in progress only': '仅连载作品',
				'Include crossovers': '包含跨圈作品',
				'Exclude crossovers': '排除跨圈作品',
				'Only crossovers': '仅限跨圈作品',
				'Single Chapter': '单个章节',
				'Rating': '分级',
				'Categories': '分类',
				'Other': '其她',
				'Work Stats': '作品统计',
				'Hits': '点击',
				'Kudos': '点赞',
				'Kudos ♥': '点赞 ♥',
				'Sort by': '排序方式',
				'Best Match': '最佳匹配',
				'Sort direction': '排序方向',
				'Descending': '降序',
				'Ascending': '升序',
				'Filter by title': '按标题筛选',
				'Filter by tag': '按标签筛选',
				'Work Search': '作品搜索',
				'Any Field': '任意字段',
				'Date': '日期',
				'Crossovers': '跨圈作品',
				'Language': '语言',
				'Characters': '角色',
				'Relationships': '关系',
				'Additional Tags': '附加标签',

				// 用户搜索页
				'Search all fields': '搜索所有字段',
				'Name': '名称',
				'Fandom': '同人圈',
				'Search People': '搜索用户',

				// 标签搜索页
				'Tag name': '标签名称',
				'Find tags wrangled to specific canonical fandoms.': '查找已整理至特定规范同人圈的标签。',
				'Type': '类型',
				'Fandom': '同人圈',
				'Character': '角色',
				'Relationship': '关系',
				'Freeform': '自由标签',
				'Any type': '任意类型',
				'Wrangling status': '整理状态',
				'Canonical': '规范',
				'Non-canonical': '非规范',
				'Synonymous': '同义',
				'Canonical or synonymous': '规范或同义',
				'Non-canonical and non-synonymous': '非规范且非同义',
				'Any status': '任意状态',
				'Name': '名称',
				'Date Created': '创建日期',
				'Uses': '使用次数',
				'Search Tags': '搜索标签',
				'Title': '标题',
				'Author': '作者',
				'Artist': '画师',
				'Author/Artist': '作者/画师',
				'People Search': '用户搜索',
				'Tag Search': '标签搜索',
				'Work Tags': '作品标签',

				// 浏览
				'Expand Fandoms List': '展开同人圈列表',
				'Collapse Fandoms List': '收起同人圈列表',
				'Recent works': '最近作品',
				'Recent series': '最近系列',
				'Recent bookmarks': '最近书签',
				'Expand Works List': '展开作品列表',
				'Collapse Works List': '收起作品列表',
				'Expand Bookmarks List': '展开书签列表',
				'Collapse Booksmarks List': '收起书签列表',

				// 个人资料
				'Edit My Profile': '编辑简介',
				'Edit Profile': '编辑简介',
				'Edit Default Pseud and Icon': '编辑笔名和头像',
				'Change Username': '更改用户名',
				'Change My Username': '更改用户名',
				'Change Password': '更改密码',
				'Change My Password': '更改密码',
				'Change Email': '更改邮箱',
				'Title': '标题',
				'Location': '位置',
				'Date of Birth': '出生日期',
				'About Me': '关于我',
				'Plain text with limited HTML': '纯文本，支持有限 HTML',
				'Embedded images (<img> tags) will be displayed as HTML, including the image\'s source link and any alt text.': '嵌入的图像（<img> 标签）将显示为 HTML，包括图像的源链接和任何替代文本。',
				'Update': '更新',
				'Editing pseud': '编辑笔名',
				'Name': '名称',
				'Make this name default': '将此笔名设为默认',
				'Description': '简介',
				'Icon': '头像',
				'This is your icon.': '这是您的头像。',
				'You can have one icon for each pseud.': '每个笔名可设置一个头像。',
				'Icons can be in png, jpeg or gif form.': '头像格式支持 PNG、JPEG 和 GIF。',
				'Icons should be sized 100x100 pixels for best results.': '建议头像尺寸为 100×100 像素以获得最佳效果。',
				'Upload a new icon': '上传新头像',
				'Icon alt text': '头像替代文本',
				'Icon comment text': '头像注释文本',
				'New Pseud': '新建笔名',
				'Default Pseud': '默认笔名',
				'Edit Pseud': '编辑笔名',
				'Edit': '编辑',
				'Current username': '当前用户名',
				'New username': '新用户名',
				'Your username has been successfully updated.': '您的用户名已成功更新。',
				'Password': '密码',
				'New password': '新密码',
				'Confirm new password': '确认新密码',
				'Old password': '旧密码',
				'Current email': '当前邮箱',
				'New email': '新邮箱',
				'Enter new email again': '再次输入新邮箱',
				'Confirm New Email': '确认新邮箱',
				'Submit': '提交',
				'Create': '创建',

				// 作品
				'Rating:': '分级:',
				'Archive Warning:': 'Archive 预警:',
				'Archive Warnings:': 'Archive 预警:',
				'Archive Warning': 'Archive 预警',
				'Archive Warnings': 'Archive 预警',
				'Category:': '分类:',
				'Categories:': '分类:',
				'Fandom:': '同人圈:',
				'Fandoms:': '同人圈:',
				'Relationship:': '关系:',
				'Relationships:': '关系:',
				'Character:': '角色:',
				'Characters:': '角色:',
				'Additional Tag:': '附加标签:',
				'Additional Tags:': '附加标签:',
				'Language:': '语言:',
				'Series': '系列',
				'Series:': '系列:',
				'Stats:': '统计:',
				'Published:': '发布于:',
				'Completed:': '完结于:',
				'Updated:': '更新于:',
				'Words:': '字数:',
				'Chapters:': '章节:',
				'Comments:': '评论:',
				'Kudos:': '点赞:',
				'Bookmarks:': '书签:',
				'Hits:': '点击:',
				'Complete?': '已完结？',
				'Word Count:': '字数:',
				'Date Updated:': '更新日期:',
				'Post': '发布',
				'New Work': '新作品',
				'Edit Work': '编辑作品',
				'Import Work': '导入作品',
				'From Draft': '从草稿',
				'Edit': '编辑',
				'Edit Tags': '编辑标签',
				'Add Chapter': '添加章节',
				'Post Draft': '发布草稿',
				'Delete Draft': '删除草稿',
				'Post Chapter': '发布章节',
				'Edit Chapter': '编辑章节',
				'Delete Chapter': '删除章节',
				'Manage Chapters': '管理章节',
				'Drag chapters to change their order.': '拖动章节以更改顺序。',
				'Enter new chapter numbers.': '输入新的章节编号。',
				'Update Positions': '更新顺序',
				'Update': '更新',
				'Delete': '删除',
				'Cancel': '取消',
				'Save': '保存',
				'Saved': '已保存',
				'Submit': '提交',
				'Orphan Work': '匿名化作品',
				'Orphan Works': '匿名化作品',
				'Filters': '筛选器',
				'Sort By': '排序方式',
				'Random': '随机',
				'Creator': '创作者',
				'Date Updated': '更新日期',
				'Word Count': '字数统计',
				'Summary': '简介',
				'Summary:': '简介:',
				'Notes': '注释',
				'Work Text': '作品正文',
				'Chapter Index': '章节索引',
				'Full-page index': '整页索引',
				'Full-Page Index': '整页索引',
				'Entire Work': '完整作品',
				'Next Chapter': '下一章',
				'Previous Chapter': '上一章',
				'kudos': ' 个赞',
				'bookmark': ' 条书签',
				'comment': ' 条评论',
				'← Previous': '← 上一页',
				'Next →': '下一页 →',
				'All fields are required. Your email address will not be published.': '所有字段均为必填。您的电子邮箱地址不会被公开。',
				'Guest name': '访客名称',
				'Guest email': '访客邮箱',
				'Please enter your name.': '请输入您的名称',
				'Please enter your email address.': '请输入您的电子邮箱地址',
				'Hide Creator\'s Style': '隐藏创作者样式',
				'Show Creator\'s Style': '显示创作者样式',
				'top level comment': '主评论',
				'Share Work': '分享作品',
				'Restore From Last Unposted Draft?': '从上次未发布的草稿继续',
				'Delete Work': '删除作品',
				'Save As Draft': '存为草稿',
				'Save Draft': '保存草稿',
				'Post Work': '发布作品',


				// 合集
				'Collections in the Archive of Our Own': ' AO3 中的合集',
				'Profile': '简介',
				'Join': '加入',
				'Leave': '退出',
				'Open Challenges': '开放中的挑战',
				'Open Collections': '开放中的合集',
				'Closed Collections': '已截止的合集',
				'Moderated Collections': '审核制合集',
				'Unmoderated Collections': '非审核制合集',
				'Unrevealed Collections': '未公开合集',
				'Anonymous Collections': '匿名合集',
				'Sort and Filter': '排序及筛选',
				'Filter collections:': '筛选合集:',
				'Filter by title or name': '按标题或名称筛选',
				'Filter by fandom': '按同人圈筛选',
				'Closed': '已截止',
				'Multifandom': '跨圈',
				'Yes': '是',
				'No': '否',
				'Either': '皆可',
				'Collection Type': '合集类型',
				'No Challenge': '无挑战',
				'Any': '任意',
				'Clear Filters': '清除筛选',

				// 书签
				'Bookmark Search': '书签搜索',
				'Edit Bookmark': '编辑书签',
				'Start typing for suggestions!': '开始输入以获取建议',
				'Searching...': '搜索中…',
				'(No suggestions found)': '未找到建议',
				'Any field on work': '作品任意字段', 'Work tags': '作品标签', 'Type': '类型', 'Work': '作品', 'Work language': '作品语言', 'External Work': '外部作品', 'Date updated': '更新日期', 'Bookmark': '书签', 'Any field on bookmark': '书签任意字段', 'Bookmarker\'s tags': '书签创建者的标签', 'Bookmarker': '书签创建者', 'Bookmark type': '书签类型', 'Rec': '推荐', 'With notes': '含注释', 'Date Bookmarked': '书签创建日期', 'Date bookmarked': '书签创建日期', 'Search Bookmarks': '搜索书签',
				'Search Results': '搜索结果', 'Edit Your Search': '修改搜索设置',
				'Ratings': '分级',
				'Include': '包括',
				'Include Ratings': '包括分级',
				'Other tags to include': '要包括的其她标签',
				'Exclude': '排除',
				'Other tags to exclude': '要排除的其她标签',
				'More Options': '更多选项',
				'Show only crossovers': '仅显示跨圈作品',
				'Completion Status': '完成状态',
				'Search within results': '在结果中搜索',
				'Bookmarker\'s Tags': '书签创建者标签',
				'Other work tags to include': '要包括的其她作品标签',
				'Other bookmarker\'s tags to include': '要包括的其她书签创建者标签',
				'Search bookmarker\'s tags and notes': '搜索书签创建者标签和注释',
				'Other work tags to exclude': '要排除的其她作品标签',
				'Other bookmarker\'s tags to exclude': '要排除的其她书签创建者标签',
				'Bookmark types': '书签类型',
				'Recs only': '仅推荐',
				'Only bookmarks with notes': '仅含注释',
				'All Bookmarks': '所有书签',
				'Add To Collection': '添加到合集',
				'Share': '分享',
				'Private Bookmark': '私人书签',
				'Your tags': '标签',
				'Plain text with limited HTML': '纯文本，支持有限 HTML',
				'The creator\'s tags are added automatically.': '创建者的标签会自动添加',
				'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
				'Add to collections': '添加到合集',
				'Private bookmark': '私人书签',
				'Create': '创建',
				'Bookmark was successfully deleted.': '书签已成功删除。',
				'Add Bookmark to collections': '将书签添加到合集',
				'Collection name(s):': '合集名称：',
				'collection name': '合集名称',
				'Add': '添加',
				'Back': '返回',
				'Bookmark was successfully updated.': '书签已成功更新。',
				'Share Bookmark': '分享书签',
				'Close': '关闭',
				'Show': '展示',
				'Bookmark Collections:': '书签合集:',

				// 系列
				'Creators:': '创建者:',
				'Creator:': '创建者:',
				'Series Begun:': '系列开始于:',
				'Series Updated:': '系列更新于:',
				'Description:': '描述:',
				'Notes:': '注释:',
				'Works:': '作品:',
				'Complete:': '完结:',

				// 语言
				'Work Languages': '作品语言',
				'Suggest a Language': '建议语言',

				// 界面
				'You are now using the default Archive skin again!': '您已重新切换至 Archive 默认界面！',
				'Revert to Default Skin': '恢复默认界面',
				'Role:': '功能:',
				'user': '用户',
				'Media:': '媒体:',
				'all': '全部',
				'Condition:': '状态:',
				'Normal': '正常',
				'(No Description Provided)': '（未提供描述）',
				'Parent Skins': '母级界面',
				'Use': '使用',
				'Stop Using': '停用',
				'Preview': '预览',
				'Set For Session': '为当前会话设置',
				'override': '覆盖',

				// 屏蔽与静音
				'Block': '屏蔽',
				'Unblock': '取消屏蔽',
				'Mute': '静音',
				'Unmute': '取消静音',
				'Yes, Unmute User': '是的，取消静音',
				'Yes, Mute User': '是的，静音用户',
				'Yes, Unblock User': '是的，取消屏蔽',
				'Yes, Block User': '是的，屏蔽用户',

				// 提示信息
				'Your profile has been successfully updated': '您的个人资料已成功更新。',
				'Your edits were put through! Please check over the works to make sure everything is right.': '您的编辑已生效！请检查相关作品，确保所有更改都已正确应用。',
				'We\'re sorry! Something went wrong.': '非常抱歉！操作未完成，请稍后重试。',
				'Your preferences were successfully updated.': '您的偏好设置已成功更新。',
				'Works and bookmarks listed here have been added to a collection but need approval from a collection moderator before they are listed in the collection.': '此处列出的作品和书签已添加至合集中，但需经合集管理员批准后才会在合集内显示。',
				'Successfully logged out.': '已成功登出。',
				'Successfully logged in.': '已成功登录。',
				'Bookmark was successfully created. It should appear in bookmark listings within the next few minutes.': '书签已创建成功。它将在接下来的几分钟内出现在书签列表中。',
				'Browse fandoms by media or favorite up to 20 tags to have them listed here!': '可按媒体浏览同人圈，或收藏最多 20 个标签以在此展示。',
				'You can search this page by pressing': '按', 'ctrl F': ' Ctrl + F ', 'cmd F': ' Cmd + F ，', '': '', 'and typing in what you are looking for.': '输入关键词即可在本页搜索。',
				'Sorry! We couldn\'t save this bookmark because:': '抱歉！我们无法保存此书签，因为', 'Pseud can\'t be blank': '笔名不能为空',
				'The following challenges are currently open for sign-ups! Those closing soonest are at the top.': '以下挑战现已开放报名！即将截止的挑战排在最前面。',
				'You currently have no works posted to the Archive. If you add some, you\'ll find information on this page about hits, kudos, comments, and bookmarks of your works.': '您当前没有任何已发布的作品。添加作品后，您可以在此页面查看作品的访问量、点赞、评论和书签情况。',
				'Users can also see how many subscribers they have, but not the names of their subscribers or identifying information about other users who have viewed or downloaded their works.': '用户还可以查看自己的订阅者数量，但无法看到订阅者的姓名，也无法获取浏览或下载其作品的其她用户的任何身份信息。',
				'This work could have adult content. If you continue, you have agreed that you are willing to see such content.': '此作品可能含有成人内容。若您选择“继续”，即表示您同意查看此类内容。',
				'Yes, Continue': '是，继续',
				'No, Go Back': '否，返回',
				'Set your preferences now': '设置偏好',
				'Work successfully deleted from your history.': '该作品已成功从您的历史记录中删除。',
				'Your history is now cleared.': '您的历史记录已清除。',
				'You are already signed in.': '您已登录。',
				'There are no works or bookmarks under this name yet.': '此名称下尚无作品或书签。',
				'Sorry, you don\'t have permission to access the page you were trying to reach. Please log in.': '抱歉，您无权访问目标页面。请先登录。',
				'Are you sure you want to delete this draft?': '您确定要删除此草稿吗？',
				'Work was successfully updated.': '作品已成功更新。',
				'The work was not updated.': '作品没有更新。',
				'Your changes have not been saved. Please post your work or save as draft if you want to keep them.': '您的更改尚未保存。如果您想保留，请发布作品或将其保存为草稿。',
				'Work was successfully posted. It should appear in work listings within the next few minutes.': '作品已成功发布。它将在接下来的几分钟内出现在作品列表中。',
				'Are you sure you want to delete this work? This will destroy all comments and kudos on this work as well and CANNOT BE UNDONE!': '您确定要删除这篇作品吗？此操作将一并删除该作品收到的所有评论和点赞，且无法撤销！',
				'Chapter has been posted!': '章节已成功发布！',
				'Chapter was successfully updated.': '章节已成功更新。',
				'Are you sure?': '您确定吗？',
				'The chapter was successfully deleted.': '已成功删除此章节。',
				'Chapter order has been successfully updated.': '章节顺序已成功更新。',
				'This is a draft chapter in a posted work. It will be kept unless the work is deleted.': '这是已发布作品中的一篇草稿章节。除非作品被删除，否则该草稿将一直保留。',
				'This chapter is a draft and hasn\'t been posted yet!': '本章节为草稿，尚未发布！',
				'Are you sure you want to delete this bookmark?': '您确定要删除此书签吗？',
				'This is part of an ongoing challenge and will be revealed soon!': '本作品正在参与一项开放中的挑战，内容将很快揭晓！',
				'Your search failed because of a syntax error. Please try again.': '搜索失败，您的查询存在语法错误。请修改后重试。',
				'Type or paste formatted text.': '输入或粘贴带有格式的文本',
				'Comment created!': '评论已发布！',
				'Are you sure you want to delete this comment?': '您确定要删除这条评论吗？',
				'Yes, delete!': '是的，删除！',
				'Comment deleted.': '评论已删除。',
				'(Previous comment deleted.)': '（原评论已删除）',
				'Freeze Thread': '锁定评论串',
				'Comment thread successfully frozen!': '已成功锁定评论串！',
				'Unfreeze Thread': '解锁评论串',
				'Comment thread successfully unfrozen!': '已成功解锁评论串！',
				'Frozen': '已锁定',
				'Comment was successfully updated.': '评论已成功更新。',
				'Sorry! We couldn\'t save this skin because:': '抱歉！我们无法保存此界面，因为：',
				'Title must be unique': '标题必须唯一',
				'We couldn\'t find any valid CSS rules in that code.': '代码中不存在任何有效的 CSS 规则',
				'Skin was successfully created.': '界面已成功创建。',
				'Skin was successfully updated.': '界面已成功删除。',
				'Are you sure you want to delete this skin?': '您确定要删除此界面吗？',
				'The skin was deleted.': '界面已删除。',
				'Your changes have not been saved. Please post your work or save the draft if you want to keep them.': '您的更改尚未保存。如果您想保留，请发布作品或保存草稿。',
				'Are you sure you want to change your username?': '您确定要更改用户名吗？',
				'This has been deleted, sorry!': '抱歉，此内容已被删除！',
				'Collection status updated!': '合集状态已更新！',
				'The pseud was successfully deleted.': '笔名已成功删除。',
				'Pseud was successfully deleted.': '笔名已成功删除。',
				'You can only see your own drafts, sorry!': '抱歉！您只可以查看您自己的草稿。',

				// 标签说明
				'This tag indicates adult content.': '此标签涉及成人内容。',
				'Parent tags (more general):': '母级标签（更通用）：',
				'Tags with the same meaning:': '同义标签：',
				'Metatags:': '元标签：',
				'Subtags:': '子标签：',
				'Child tags (displaying the first 300 of each type):': '子标签（每种类型显示前 300 个）：',
				'and more': '以及更多',
				'Relationships by Character': '关系按角色分类'
			},
			'innerHTML_regexp': [

				['h4.heading', /^\s*Hi,\s+(.+?)!\s*$/s, '您好，$1！'],
				[
					'li.dropdown a.dropdown-toggle',
					/^\s*Hi,\s+(.+?)!\s*$/s,
					'您好，$1！'
				],

				// 用户主页
				['li a, li span.current', /^\s*Works\s*\((\d+)\)\s*$/s, '作品（$1）'],
				['li a, li span.current', /^\s*Drafts\s*\((\d+)\)\s*$/s, '草稿（$1）'],
				['li a, li span.current', /^\s*Series\s*\((\d+)\)\s*$/s, '系列（$1）'],
				['li a, li span.current', /^\s*Bookmarks\s*\((\d+)\)\s*$/s, '书签（$1）'],
				['li a, li span.current', /^\s*Collections\s*\((\d+)\)\s*$/s, '合集（$1）'],
				['li a, li span.current', /^\s*Inbox\s*\((\d+)\)\s*$/s, '消息中心（$1）'],
				['li a, li span.current', /^\s*Sign-ups\s*\((\d+)\)\s*$/s, '报名挑战（$1）'],
				['li a, li span.current', /^\s*Assignments\s*\((\d+)\)\s*$/s, '任务中心（$1）'],
				['li a, li span.current', /^\s*Claims\s*\((\d+)\)\s*$/s, '我的认领（$1）'],
				['li a, li span.current', /^\s*Related Works\s*\((\d+)\)\s*$/s, '相关作品（$1）'],
				['li a, li span.current', /^\s*Gifts\s*\((\d+)\)\s*$/s, '接收赠文（$1）'],
				['li a, li span.current', /^\s*Challenge Sign-ups\s*$/s, '挑战活动报名'],
				['li a, li span.current', /^\s*Gifts\s*$/s, '接收赠文'],
				['a', /^\s*Unsubscribe from (.+?)\s*$/s, '取消订阅 $1'],
				['h2.heading', /^\s*Works by\s+(.+?)\s*$/s, '$1 的作品'],
				['h2.heading', /^\s*Series by\s+(.+?)\s*$/s, '$1 的系列'],
				['h2.heading', /^\s*Bookmarks by\s+(.+?)\s*$/s, '$1 的书签'],
				['h2.heading', /^\s*Collections by\s+(.+?)\s*$/s, '$1 的合集'],
				['h2.heading', /^\s*Gifts for\s+(.+?)\s*$/s, '$1 收到的赠文'],
				['h2.heading', /^\s*(.+?)'s Related Works\s*$/s, '$1 的相关作品'],
				['h2.heading', /^\s*(.+?)'s Collections\s*$/s, '$1 的合集'],
				['h2.heading', /^\s*Challenge Sign-ups for\s+(.+?)\s*$/s, '$1 参加的挑战'],
				[
					'h2.heading',
					/^\s*(\d+)\s+Works?\s+by\s+(.+?)\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
					'$3（$2）：$1 篇作品'
				],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+?)\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
					'$5（$4）：$3 篇作品，第 $1 - $2 篇'
				],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
					'$4：$3 篇作品，第 $1 - $2 篇'
				],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+?)\s*$/s,
					'$4：$3 篇作品，第 $1 - $2 篇'
				],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Series\s+by\s+(.+?)\s*$/s,
					'$4：$3 个系列，第 $1 - $2 个'
				],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Bookmarks?\s+by\s+(.+?)\s*$/s,
					'$4：$3 条书签，第 $1 - $2 条'
				],
				['h2.heading', /^\s*(\d+)\s+Works?\s+by\s+(.+?)\s*$/s, '$2：$1 篇作品'],
				['h2.heading', /^\s*(\d+)\s+Series\s+by\s+(.+?)\s*$/s, '$2：$1 个系列'],
				['h2.heading', /^\s*(\d+)\s+Bookmarks?\s+by\s+(.+?)\s*$/s, '$2：$1 条书签'],
				['h2.heading', /^\s*(\d+)\s+Collections?\s+by\s+(.+?)\s*$/s, '$2：$1 个合集'],
				['h2.heading', /^\s*(\d+)\s+Unposted\s+Drafts?\s*$/s, '未发布的草稿：$1'],

				// 浏览
				[
					'p',
					/^\s*These are some of the latest works posted to the Archive\. To find more works, <a href="\/media">choose a fandom<\/a> or <a href="\/works\/search">try our advanced search<\/a>\.\s*(?:<!--[\s\S]*?-->)?\s*$/s,
					'这里展示了一些最新发布的作品。若要查看更多作品，请<a href="/media">选择一个同人圈</a>或<a href="/works/search">尝试高级搜索</a>。'
				],
				[
					'p',
					/^\s*These are some of the latest bookmarks created on the Archive\. To find more bookmarks,\s*<a href="\/media">choose a fandom<\/a>\s*or\s*<a href="\/bookmarks\/search">try our advanced search<\/a>\.\s*(?:<!--[\s\S]*?-->)?\s*$/s,
					'这里展示了一些最新创建的书签。若要查看更多书签，请<a href="/media">选择一个同人圈</a>或<a href="/bookmarks/search">尝试高级搜索</a>。'
				],
				[
					'p',
					/^\s*These are some of the most popular tags used on the Archive\. To find more tags,\s*<a href="\/tags\/search">try our tag search<\/a>\.\s*$/s,
					'这里展示了一些最常用的标签。若要查看更多标签，请<a href="/tags/search">尝试标签搜索</a>。'
				],
				[
					'h2.heading',
					/^\s*Chapter Index for\s+(<a href="\/works\/\d+">.+?<\/a>)\s+by\s+(<a rel="author" href="\/users\/.+?">.+?<\/a>)\s*$/s,
					'章节索引：$1 by $2'
				],
				['p', /^\s*<strong>([\d,]+)\s+Found<\/strong>\s*$/, '找到 $1 条结果'],
				['h2.heading', /^\s*([\d,]+)\s+Works?\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s, '$2：$1 篇作品'],
				['dd.expandable dl.range dt label', /^From$/s, '从'],
				['dd.expandable dl.range dt label', /^To$/s, '到'],
				['label[for*="_work_search_category_ids_"] span:last-of-type', /^(Other)(\s*\(\d+\))$/s, '其她$2'],
				['label[for*="_bookmark_search_category_ids_"] span:last-of-type', /^(Other)(\s*\(\d+\))$/s, '其她$2'],
				['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s*of\s*([0-9,]+)\s*Bookmarks by\s*(.+)\s*$/s, '$4：$3 条书签，第 $1 - $2 条'],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+?)\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
					'$5（$4）：$3 篇作品，第 $1 - $2 篇'
				],
				['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+)\s*$/s, '$4：$3 篇作品，第 $1 - $2 篇'],
				['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+(?:Bookmarked Items|已创建书签作品) in\s+(<a[^>]+>.+?<\/a>)\s*$/s, '$4：$3 篇已创建书签作品，第 $1 - $2 篇'],
				['h2.heading', /^\s*Gifts for\s+(.+)\s*$/s, '$1 收到的赠文'],
				['h2.heading', /^\s*(.+)'s Collections\s*$/s, '$1：合集'],
				['h5.byline.heading', /^\s*Bookmarked by\s*(<a .*?<\/a>)/s, '创建者：$1'],
				['li', /^\s*Part (<strong>\d+<\/strong>) of (<a .*?<\/a>)/, '$2 第 $1 部分'],
				['h2.heading', /^New bookmark for (<a href="\/works\/\d+">.*?<\/a>)/, '为 $1 创建新书签'],
				['h5.heading a', /^(\d+)\s+works?$/s, '$1 篇作品'],
				['h5.heading a', /^(\d+)\s+recs?$/s, '$1 条推荐'],
				['h2.heading', /^\s*Items\s+by\s+(.+?)\s+in\s+Collections\s*$/s, '$1 在合集中的作品'],
				['dd a', /^([\d,]+)\s+works?$/s, '$1 篇作品'],
				['h2.heading', /^\s*([\d,]+)\s+Works?\s*$/s, '$1 篇作品'],
				['h2.heading', /^\s*([\d,]+)\s+Collections?\s*$/s, '$1 个合集'],
				[
					'dt',
					/(<\/a>)\s*\(Work\)\s+by\s*(<a\s+rel="author".*?>.*?<\/a>|[^<]+)/s,
					'$1（作品）by $2'
				],
				[
					'dt',
					/(<\/a>)\s*\(Series\)\s+by\s*(<a\s+rel="author".*)/s,
					'$1（系列）by $2'
				],
				[
					'h4.heading',
					/<img alt="\(Restricted\)" title="Restricted" src="\/images\/lockblue\.png"[^>]*>/g,
					'<img alt="(访问受限)" title="访问受限" src="/images/lockblue.png" width="15" height="15">'
				],
				['li.pseud ul a[href$="/pseuds"], li.pseud ul span.current', /^\s*All Pseuds\s*\((\d+)\)\s*$/s, '所有笔名 ($1)'],

				// 个人资料
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/g, '剩余 $1 字符'],
				['p#password-field-description', /^\s*6 to 40 characters\s*$/, '6 到 40 字符'],
				['p.notice', /Any personal information you post on your public AO3 profile[\s\S]*?<a href="\/privacy">(?:Privacy Policy|隐私政策)<\/a>[\s\S]*?\./s, '您在公开 AO3 个人资料中发布的任何个人信息（包括但不限于您的姓名、电子邮箱、年龄、位置、个人关系、性别或性取向认同、种族或族裔背景、宗教或政治观点，以及/或其她网站的账户用户名）都会对公众可见。要了解 AO3 在您使用网站时收集哪些数据以及我们如何使用这些数据，请查看我们的<a href="/privacy">隐私政策</a>。'],
				['div.caution.notice', /<p>\s*<strong>Please use this feature with caution\.<\/strong>[\s\S]*?<\/p>/s, '<p><strong>请谨慎使用此功能。</strong>用户名每 7 天仅能更改一次。</p>'],
				['div.notice', /Changing your email will send a request for confirmation[\s\S]*?will <strong>invalidate any pending email change requests<\/strong>\./s, '更改电子邮箱将向您的新邮箱发送确认请求，并向当前邮箱发送通知。<br>您必须使用确认邮件中的链接完成邮箱更改。如在 7 天内未确认，请求链接将失效，邮箱不会更改。<br>重新提交新邮箱请求将使<strong>任何未完成的更改请求失效</strong>。'],
				['p.footnote', /You cannot change the pseud that matches your username\. However, you can <a href="([^"]*change_username[^"]*)">change your username<\/a> instead\./g, '无法修改与用户名相同的笔名。如需修改，请<a href="$1">更改您的用户名</a>。'],
				['h2.heading', /^Pseuds for (.+)$/, '$1 的笔名'],
				['div.caution.notice p:last-child', /For information on how changing your username will affect your account.*?contact Support.*?\./s, '要了解更改用户名对账户的影响，请参阅<a href="/faq/your-account#namechange">账户常见问题</a>。用户名变更可能需要数天或更长时间才会生效。如果一周后您的作品、书签、系列或合集中仍显示旧用户名，请<a href="/support">联系支持团队</a>。'],
				['p.note', /If that is not what you want.*?create a new Pseud.*?instead\./s, '如果您不想更改用户名，也可以<a href="/users/Ubifo/pseuds/new">创建一个新的笔名</a>。'],
				['p.footnote', /3 to 40 characters.*?underscore.*?\)/s, '3 至 40 个字符（仅限 A–Z、a–z、_、0–9），禁止使用空格，且不能以下划线开头或结尾'],
				[
					'div.caution.notice p',
					/For information on how changing your username will affect your account[\s\S]*?<a href="\/support">contact Support<\/a>[.。]?/s,
					'有关更改用户名如何影响账户的详情，请参阅<a href="/faq/your-account#namechange">账户常见问题</a>。用户名更改可能需要数天或更长时间才会生效。如果一周后您的作品、书签、系列或合集中仍显示旧用户名，请<a href="/support">联系支持团队</a>。'
				],
				[
					'div.flash.notice',
					/^\s*Your password has been changed\. To protect your account, you have been logged out of all active sessions\. Please log in with your new password\.\s*$/s,
					'您的密码已更改。为了保护您的账户，您已从所有活动会话中登出。请使用新密码登录。'
				],

				// 作品
				[
					'span.role',
					/^\s*\(Guest\)\s*$/i,
					' (访客)'
				],
				[
					'span.parent',
					/^\s*on\s+(<a[^>]+>)Chapter\s+(\d+)(<\/a>)\s*$/is,
					'：$1第 $2 章$3'
				],
				[
					'span.parent',
					/^\s*on\s+(<a[^>]+>)Chapter\s+(\d+)\s+of\s+(\d+)(<\/a>)\s*$/is,
					'：$1第 $2 章 / 共 $3 章$4'
				],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Series\s+by\s+(.+?)\s*$/s,
					'$4：$3 个系列，第 $1 - $2 个'
				],
				[
					'h3.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Collections\s*$/s,
					'$3 个合集，第 $1 - $2 个'
				],
				[
					'p.type',
					/^\s*\((Open|Closed)(.*)\)\s*$/s,
					(_match, status, rest) => {
						const map = { 'Open': '开放中', 'Closed': '已截止' };
						return `(${map[status]}${rest})`;
					}
				],
				[
					'h2.heading',
					/^\s*Collections including\s+(.+?)\s*$/s,
					'包含 $1 的合集'
				],
				[
					'h3.heading',
					/^\s*(\d+)\s+Collections?\s*$/s,
					'$1 个合集'
				],
				// 书签
				[
					'h4.heading',
					/^\s*<span class="byline">\s*(.+?),\s*(<input[^>]+>)\s*<\/span>\s*save a bookmark!\s*$/s,
					'保存书签（<span class="byline">$1$2</span>）'
				],
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
				['div.flash.notice', /^Added to collection\(s\):\s+(.*)\.$/s, '已添加到合集：$1 。'],
				[
					'p.note',
					/^\s*Copy and paste the following code to link back to this work \((<kbd>CTRL A<\/kbd>\/<kbd>CMD A<\/kbd>) will select all\), or use the Tweet or Tumblr links to share the work on your Twitter or Tumblr account\.\s*$/s,
					'请复制以下代码以添加指向此作品的链接（按 $1 可全选），或使用 Tweet / Tumblr 链接在您的 Twitter / Tumblr 账户上分享此作品。'
				],
				['h2.heading', /^\s*([\d,]+)\s+Bookmarks?\s*$/s, '$1 条书签'],
				[
					'h2.heading',
					/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Bookmarks?\s*$/s,
					'$3 条书签，第 $1 - $2 条'
				],
				[
					'h6.landmark.heading',
					/^Bookmarker's Notes$/,
					'书签创建者的注释'
				],
				[
					'h4.heading',
					/^Mystery Work$/,
					'神秘作品'
				],
				[
					'h5.heading',
					/^Part of (<a href="\/collections\/.*?">.+?<\/a>)$/,
					'属于合集：$1'
				],
				[
					'p.notes',
					/^\s*Looking for prompts you claimed in a prompt meme\? Try\s+(<a href="[^"]+">)My Claims(<\/a>)\.?\s*$/s,
					'想查看您在“接梗挑战”中认领的同人梗？请前往$1我的认领$2。'
				],
				[
					'h2.heading',
					/^\s*My Claims\s*$/i,
					'我的认领'
				],
				[
					'p.notes',
					/^\s*Looking for assignments you were given for a gift exchange\? Try\s+(<a[^>]+>)My Assignments(<\/a>)\.?\s*$/is,
					'想查看您在赠文交换活动中被分配的任务？请前往$1任务中心$2。'
				],
				[
					'h2.heading',
					/^\s*My Assignments\s*$/i,
					'任务中心'
				],
				[
					'h4.heading a',
					/^Bookmark for (.*)$/,
					'书签：$1'
				],
				[
					'h5.heading',
					/^\s*in\s+(<span class="collection">.*?<\/span>)\s*$/s,
					'$1'
				],

				// 界面
				['div.flash.notice', /^The skin (.+) has been set\. This will last for your current session\.$/s, '$1 界面已启用，此设置将在当前会话期间持续生效。'],
				['h2.heading', /^\s*(.+?)\s+skin by\s+(.+?)\s*$/s, '$1 界面，提供者：$2'],

				// 笔名
				[
					'dd',
					/^\s*<ul class="notes">\s*<li>You can have one icon for each pseud\.<\/li>\s*<li>Icons can be in png, jpeg or gif form\.<\/li>\s*<li>Icons should be sized 100x100 pixels for best results\.<\/li>\s*<\/ul>\s*$/s,
					'<ul class="notes"><li>每个笔名可设置一个头像。</li><li>头像格式支持 PNG、JPEG 和 GIF。</li><li>建议头像尺寸为 100×100 像素以获得最佳效果。</li></ul>'
				],

				// 匿名化作品
				[
					'h2.heading',
					/^\s*Orphan All Works by (.*?)\s*$/s,
					'匿名化 $1 的所有作品'
				],
				[
					'p.caution.notice',
					/^\s*Orphaning all works by (.*?) will\s*<strong>permanently<\/strong>\s*remove the pseud \1 from the following work\(s\), their chapters, associated series, and any feedback replies you may have left on them\.\s*$/s,
					'匿名化 $1 的所有作品将从以下作品、其章节、关联系列以及您可能留下的任何反馈回复中<strong>永久</strong>移除笔名 $1 。'
				],
				[
					'p.caution.notice',
					/^\s*Unless another one of your pseuds is listed as a creator on the work\(s\) below, orphaning them will remove them from your account and re-attach them to the specially created orphan_account\. Please note that this is\s*<strong>permanent and irreversible\.<\/strong>\s*You are giving up control over the work\(s\),\s*<strong>including the ability to edit or delete them\.<\/strong>\s*$/s,
					'除非以下作品的创作者名单中包含您的其她笔名，否则匿名化操作会将这些作品从您的账户中移除，并重新关联至专门创建的 orphan_account（匿名帐户）。请注意，此操作是<strong>永久且不可逆的。</strong>您将放弃对这些作品的控制权，<strong>包括编辑或删除它们的能力。</strong>'
				],

				// 屏蔽与静音
				['h2.heading',
					/^Mute (.*)$/s,
					'静音 $1'
				],
				['div.caution.notice',
					/^\s*<p>\s*Are you sure you want to <strong>mute<\/strong> ([^<]+)\?\s*Muting a user:\s*<\/p>[\s\S]*?<li>completely hides their works, series, bookmarks, and comments from you; there will be no empty space, placeholder text, or other indication something has been removed<\/li>[\s\S]*?<p>Muting a user will not:<\/p>[\s\S]*?<li>prevent you from receiving comment or subscription emails from this user<\/li>\s*<li>hide their works, series, bookmarks, and comments from anyone else<\/li>[\s\S]*?<p>\s*To prevent a user from commenting on your works or replying to your comments elsewhere on the site, visit <a href="([^"]+)">your Blocked Users page<\/a>\.\s*<\/p>[\s\S]*?<p>[\s\S]*?<a href="([^"]+)">instructions for reverting to the default site skin<\/a>\.\s*<\/p>\s*$/s,
					`<p>您确定要静音 <strong>$1</strong> 吗？静音用户后：</p>
                    <ul><li>她们的作品、系列、书签和评论将完全对您隐藏；不会留下空白空间、占位文本或其她任何提示</li></ul>
                    <p>静音用户不会：</p>
                    <ul>
                    <li>阻止您接收来自该用户的评论或订阅邮件</li>
                    <li>将她们的内容隐藏给其她任何人</li>
                    </ul>
                    <p>如需阻止某用户在您的作品上发表评论或在站点其她地方回复您的评论，请访问<a href="$2">已屏蔽用户页面</a>。</p>
                    <p>请注意，如果您未使用默认站点界面，静音功能可能无法正常工作。要了解有关<a href="$3">如何恢复默认站点界面</a>的说明，请参阅界面与 Archive 界面常见问题。</p>`
				],
				['div.flash.notice',
					/^You have muted the user ([^<]+)\.$/s,
					'您已静音用户 $1 。'
				],
				['h2.heading',
					/^Block (.*)$/s,
					'屏蔽 $1'
				],
				['div.caution.notice',
					/^\s*<p>\s*Are you sure you want to <strong>block<\/strong> ([^<]+)\?\s*Blocking a user prevents them from:\s*<\/p>[\s\S]*?<ul>\s*<li>commenting or leaving kudos on your works<\/li>\s*<li>replying to your comments anywhere on the site<\/li>\s*<li>giving you gift works outside of challenge assignments and claimed prompts<\/li>\s*<\/ul>[\s\S]*?<p>Blocking a user will not:<\/p>[\s\S]*?<ul>\s*<li>hide their works or bookmarks from you<\/li>\s*<li>delete or hide comments they previously left on your works; you can delete these individually<\/li>\s*<li>hide their comments elsewhere on the site<\/li>\s*<\/ul>[\s\S]*?<p>To hide a user's works, bookmarks, series, and comments from you, visit <a href="([^"]+)">your Muted Users page<\/a>\.<\/p>\s*$/s,
					`<p>您确定要屏蔽 <strong>$1</strong> 吗？屏蔽用户后，她们将无法：</p>
                    <ul>
                    <li>在您的作品上发表评论或留下点赞</li>
                    <li>在站点任何地方回复您的评论</li>
                    <li>在挑战分配和认领同人梗之外赠送作品给您</li>
                    </ul>
                    <p>屏蔽用户不会：</p>
                    <ul>
                    <li>隐藏您所屏蔽用户的作品或书签</li>
                    <li>删除或隐藏她们之前在您作品上留下的评论；您可以逐条删除</li>
                    <li>隐藏她们在站点其她地方的评论</li>
                    </ul>
                    <p>如需隐藏某用户的作品、书签、系列和评论，请访问<a href="$2">已静音用户页面</a>。</p>`
				],
				['p.actions',
					/<a href="([^"]+)">Cancel<\/a>\s*<input type="submit" name="commit" value="Yes, Block User">/s,
					'<a href="$1">取消</a> <input type="submit" name="commit" value="是的，屏蔽用户">'
				],
				['div.flash.notice',
					/^You have blocked the user ([^<]+)\.$/s,
					'您已屏蔽用户 $1 。'
				],
				['h2.heading',
					/^Unblock (.*)$/s,
					'取消屏蔽 $1'
				],
				['div.caution.notice',
					/^\s*<p>\s*Are you sure you want to <strong>unblock<\/strong> ([^<]+)\?\s*Unblocking a user allows them to resume:\s*<\/p>[\s\S]*?<ul>\s*<li>commenting or leaving kudos on your works<\/li>\s*<li>replying to your comments anywhere on the site<\/li>\s*<li>giving you gift works outside of challenge assignments and claimed prompts<\/li>\s*<\/ul>\s*$/s,
					`<p>您确定要取消屏蔽 <strong>$1</strong> 吗？取消屏蔽后对方将恢复以下权限：</p>
                    <ul>
                    <li>在您的作品上发表评论或留下点赞</li>
                    <li>在站点任何地方回复您的评论</li>
                    <li>在挑战分配和认领同人梗之外赠送作品给您</li>
                    </ul>`
				],
				['div.flash.notice',
					/^You have unblocked the user ([^<]+)\.$/s,
					'您已取消屏蔽用户 $1 。'
				],
				['h2.heading',
					/^Unmute (.*)$/s,
					'取消静音 $1'
				],
				['div.caution.notice',
					/^\s*<p>\s*Are you sure you want to <strong>unmute<\/strong> ([^<]+)\?\s*Unmuting a user allows you to:\s*<\/p>[\s\S]*?<ul>\s*<li>see their works, series, bookmarks, and comments on the site<\/li>\s*<\/ul>\s*$/s,
					`<p>您确定要取消静音 <strong>$1</strong> 吗？取消静音后，您将可以：</p>
                    <ul>
                    <li>在站点上查看她们的作品、系列、书签和评论</li>
                    </ul>`
				],
				['div.flash.notice',
					/^You have unmuted the user ([^<]+)\.$/s,
					'您已取消静音用户 $1 。'
				],

				// 历史记录
				[
					'h4.viewed.heading',
					/^\s*<span>Last visited:<\/span>\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+\((.*?)\)\s+Visited\s+(once|(\d+)\s+times)(?:\s+\((Marked for Later\.)\))?\s*$/s,
					(_match, day, monthAbbr, year, statusText, visitText, visitCount, markedForLaterText) => {
						const statusMap = {
							'Latest version.': '已是最新版',
							'Minor edits made since then.': '有微小修订',
							'Update available.': '作品有更新'
						};
						const translatedDate = `${year}年${monthMap[monthAbbr]}月${day}日`;
						const translatedStatus = statusMap[statusText.trim()] || statusText.trim();
						const translatedVisit = visitText === 'once' ? '阅读 1 次' : `共阅读 ${visitCount} 次`;
						const translatedMarked = markedForLaterText ? '（已标记为稍后阅读）' : '';

						let result = `上次阅读：${translatedDate}（${translatedStatus}）。${translatedVisit}`;
						if (translatedMarked) {
							result += `${translatedMarked}`;
						}
						result += '。';
						return result;
					}
				],

				// 提示信息
				[
					'#modal .content p:has(a[href*="content#II.J"])',
					/\(For more information, see the <a href="\/content#II.J">Ratings and Warnings section of the AO3 Terms of Service<\/a>\.\)/s,
					'（要了解更多信息，请参阅 <a href="/content#II.J">AO3 服务条款的分级与预警部分</a>。）'
				],
				['div.flash.error', /Sorry, additional invitations are unavailable\. Please <a href="\/invite_requests">use the queue<\/a>! If you are the mod of a challenge currently being run on the Archive, please <a href="\/support">contact Support<\/a>\. If you are the maintainer of an at-risk archive, please <a href="http:\/\/opendoors\.transformativeworks\.org\/contact-open-doors\/">contact Open Doors<\/a>\./s, '抱歉，暂时无法提供更多邀请。请<a href="/invite_requests">使用排队系统</a>！<br>如果您是正在 Archive 举办挑战活动的管理员，请<a href="/support">联系支持</a>。<br>如果您是处于风险 Archive 站点的维护者，请<a href="http://opendoors.transformativeworks.org/contact-open-doors/">联系 Open Doors</a>。'],
				['div.flash.error', /^\s*Password resets are disabled for that user\.\s*For more information, please\s*<a href="\/abuse_reports\/new">\s*contact our Policy & Abuse team\s*<\/a>\.\s*$/s, '此用户的密码重置功能已被禁用。要了解更多信息，请<a href="/abuse_reports/new">联系我们的策略与滥用团队</a>。'],
				[
					'div.flash.error',
					/^\s*Your current session has expired and we can't authenticate your request\. Try logging in again, refreshing the page, or <a href="http:\/\/kb\.iu\.edu\/data\/ahic\.html">clearing your cache<\/a> if you continue to experience problems\.\s*$/s,
					'您当前的会话已过期，无法验证您的请求。如问题持续存在，请重新登录、刷新页面，或清除缓存。'
				],
				['h2.heading', /^Error 404$/, '错误 404'],
				['h3.heading', /^The page you were looking for doesn't exist\.$/, '您查找的页面不存在。'],
				['div.error-404 p', /^You may have mistyped the address or the page may have been deleted\.$/, '您可能输入了错误的地址或该页面已被删除。'],
				[
					'h2.heading',
					/^\s*Error 503\s*$/s,
					'错误 503'
				],
				[
					'h3.heading',
					/^\s*The page was responding too slowly\.\s*$/s,
					'页面响应过慢。'
				],
				[
					'div[class*="error-"] p',
					/^\s*Check our <a href="(https:\/\/www\.otwstatus\.org)">status page<\/a> and follow (<a href="[^"]+">@status\.archiveofourown\.org<\/a>) on Bluesky or (<a href="[^"]+">ao3org<\/a>) on Tumblr for updates if this keeps happening\.\s*$/s,
					'如果此情况持续存在，请查看我们的<a href="$1">站点状态页面</a>，或在 Bluesky 上关注 $2 、在 Tumblr 上关注 $3 以获取最新动态。'
				],
				[
					'p.message.footnote',
					/^\s*If you accept cookies from our site and you choose "Yes, Continue", you will not be asked again during this session \(that is, until you close your browser\)\. If you log in you can store your preference and never be asked again\.\s*$/s,
					'若您接受本站 Cookie 并选择“是，继续”，在本次会话期间（即关闭浏览器之前）将不再弹出此提示。登录账户后可保存您的偏好设置，从而永久免除此询问。'
				],
				[
					'p.notice',
					/^\s*Sorry, this work doesn't allow non-Archive users to comment\.\s+You can however still leave Kudos!\s*$/s,
					'抱歉，此作品仅限 Archive 用户评论。不过您可以留下点赞！'
				],
				[
					'h4.heading',
					/^\s*Comment as\s+(<span class="byline">.*?<\/span>)\s*(<input[^>]*>)\s*$/is,
					'发表评论（$1）$2'
				],
				[
					'h4.heading',
					/^\s*Comment as\s+(<select[^>]*>[\s\S]*?<\/select>)\s*$/is,
					'发表评论 $1'
				],
				[
					'h4.heading',
					/^\s*(<span class="byline">\s*.+?),\s*(<input[^>]+>)\s*<\/span>\s*save a bookmark!\s*$/is,
					'保存书签（$1$2</span>）'
				],
				[
					'h4.heading',
					/^\s*(<select[^>]*>[\s\S]*?<\/select>)\s*save a bookmark!\s*$/is,
					'保存书签 $1'
				],
				[
					'p',
					/^\s*<strong>Reminder:<\/strong>\s*This site is in beta\. Things may break or crash without notice\.\s*Please report any pesky bugs and <a href="(\/support)">give us your feedback<\/a>!\s*$/s,
					'<strong>提示：</strong>本站处于测试阶段。功能可能会无预警地出现故障或崩溃。欢迎报告任何烦人的 Bug 以及<a href="$1">提交您的反馈</a>！'
				],
				[
					'p',
					/^\s*Forgot your password or username\?\s*<a href="(\/users\/password\/new)">Reset (?:your )?password<\/a>\.\s*<br.*?>\s*Don't have an account\?\s*<a href="(\/invite_requests)">Request an invitation to join<\/a>\.?\s*$/s,
					'忘记了您的密码或用户名？<a href="$1">重置密码</a>。<br>还没有帐户？<a href="$2">获取邀请</a>。'
				],
				[
					'label[for="reset_login"]',
					/^\s*Email address\s*<strong>or<\/strong>\s*username\s*$/s,
					'电子邮箱地址 <strong>或</strong> 用户名'
				],
				[
					'p.muted.notice',
					/^\s*You have muted some users on the Archive\.\s*Some items may not be shown, and any counts may be inaccurate\.\s*You can mute or unmute users on\s*<a href="(\/users\/[^\/]+\/muted\/users)">your Muted Users page<\/a>\s*[.。]?\s*$/s,
					'您已在 Archive 上静音了部分用户。部分内容可能因此不予显示，相关计数也可能并不准确。您可在<a href="$1">已静音用户</a>页面静音或取消静音用户。'
				],
				[
					'p.caution.notice',
					/^\s*This draft will be <strong>scheduled for deletion<\/strong> on\s*(<abbr class="day".*?<\/span>)\s*\.\s*$/s,
					'此草稿将于 <span>$1</span> <strong>预定删除</strong>。'
				],
				[
					'p:has(a[href="/content"]):has(a[href="/tos_faq#content_faq"])',
					/All\s+works\s+you\s+post\s+on\s+AO3\s+must\s+comply\s+with\s+our\s+<a\s+href="\/content"[^>]*>(?:Content Policy|内容政策)<\/a>\.\s*For\s+more\s+information,\s+please\s+refer\s+to\s+our\s+<a\s+href="\/tos_faq#content_faq"[^>]*>(?:Terms of Service FAQ|服务条款常见问题)<\/a>[\.。]?/s,
					'您在 AO3 发布的所有作品均必须遵守我们的<a href="/content">内容政策</a>。更多信息请参阅我们的<a href="/tos_faq#content_faq">服务条款常见问题</a>。'
				],
				[
					'p.notice',
					/^\s*This work is a draft and has not been posted\. The draft will be <strong>scheduled for deletion<\/strong> on\s*(<abbr class="day".*?<\/span>)\s*\.\s*$/s,
					'此作品是尚未发布的草稿。将于 <span>$1</span> <strong>预定删除</strong>。'
				],
				[
					'p.notice',
					/^\s*Sorry, this work doesn't allow comments\.\s*$/s,
					'抱歉，此作品不允许评论。'
				],
				[
					'h4.heading.byline',
					/^\s*Chapter by (<a\s+rel="author".*?<\/a>)\s*$/s,
					'章节作者：$1'
				],
				[
					'div.flash.notice',
					/^Draft was successfully created\. It will be <strong>scheduled for deletion<\/strong>\s+on\s+(.*)\.$/s,
					'草稿已成功创建。它将于 <span class="datetime">$1</span> <strong>预定删除</strong>。'
				],
				[
					'p',
					/^\s*This tag belongs to the Character Category\.\s*$/,
					'此标签属于“角色”分类。'
				],
				[
					'p',
					/^\s*This tag has not been marked common and can't be filtered on \(yet\)\.\s*$/,
					'此标签尚未被标记为常用，（目前）无法用于筛选。'
				],
				[
					'h3.heading',
					/^\s*Works which have used it as a tag:\s*$/,
					'使用此标签的作品：'
				],
				[
					'div.flash.error',
					/^We couldn't add your submission to the following collections: (.*?) does not exist\.$/s,
					'我们无法将您的提交添加到以下合集：$1 不存在。'
				],
				[
					'h2.heading',
					/^\s*Editing bookmark for (<a href="\/works\/\d+">.*?<\/a>)\s*$/s,
					'编辑书签：$1'
				],
				[
					'div.flash.notice',
					/^\s*Bookmark was successfully updated\.\s+Added to collection\(s\):\s*(.*?)\.\s*$/s,
					'书签已成功更新。已添加到合集：$1。'
				],
				[
					'li',
					/^\s*Translation into\s+(<span lang="[^"]+">[^<]+<\/span>)\s+available:\s+(<a href="[^"]+">.*?<\/a>)\s+by\s+(<a rel="author" href="[^"]+">.*?<\/a>)\s*$/,
					'已有 $1 译本：$2 ，译者：$3'
				],
				[
					'li',
					/^\s*A translation of\s+(<a href="[^"]+">.*?<\/a>)\s+by\s+(<a rel="author" href="[^"]+">.*?<\/a>)\s*$/,
					'翻译自：$1 ，作者：$2'
				],
				[
					'li',
					/^\s*Inspired by\s+(<a href="[^"]+">.*?<\/a>)\s+by\s+(<a rel="author" href="[^"]+">.*?<\/a>)\s*$/,
					'衍生自：$1 ，作者：$2'
				],
				[
					'li',
					/^\s*For\s+(<a href="\/users\/[^"]+\/gifts">.*?<\/a>)\s*[.。]?\s*$/,
					'赠送给：$1'
				],
				[
					'p.jump',
					/^\s*\(See the end of the work for\s*(<a[^>]+>)notes(<\/a>)\s+and\s+(<a[^>]+>)other works inspired by this one(<\/a>)\.\)\s*$/s,
					'（在作品结尾查看$1注释$2和$3相关衍生作品$4。）'
				],
				[
					'main',
					/^\s*<h2>The archive is down for maintenance\.<\/h2>\s*<p>Check our (<a href="https:\/\/www\.otwstatus\.org">status page<\/a>), (<a href="https:\/\/bsky\.app\/profile\/status\.archiveofourown\.org">@status\.archiveofourown\.org<\/a>) on Bluesky or (<a href="https:\/\/ao3org\.tumblr\.com\/">ao3org<\/a>) on Tumblr for updates\.<\/p>\s*$/s,
					'<h2> Archive 正在进行维护。</h2><p>请查看我们的 $1、Bluesky 上的 $2 或 Tumblr 上的 $3，以获取最新动态。</p>'
				],
				[
					'h3.heading',
					/^\s*Sorry!\s*$/s,
					'抱歉！'
				],
				[
					'h3.heading + p',
					/^\s*This work is only available to registered users of the Archive\.\s*If you already have an Archive of Our Own account, log in now\.\s*If you don't have an account, you can\s*<a href="\/invite_requests">.*?<\/a>\s*[.。]?\s*$/s,
					'此作品仅对 Archive 的注册用户开放。如果您已有 AO3 帐户，请立即登录。如果您还没有帐户，可以<a href="/invite_requests">获取邀请</a>。'
				],
				[
					'div#error.error ul',
					/<li>(.+?) does not accept gifts\.<\/li>/g,
					(_match, username) => `<li>${username} 不接受赠文。</li>`
				],
				[
					'div.flash.error',
					/^We couldn't add your submission to the following collection\(s\): <br><ul><li>(.*?), because this item has already been submitted\.<\/li><\/ul>$/s,
					'我们无法将您的提交添加到以下合集：<br><ul><li>$1，因为该项目已被提交。</li></ul>'
				],
				[
					'p.note',
					/^\s*Follow AO3 on Bluesky or Tumblr for status updates, and don't forget to check out the <a href="https:\/\/www\.transformativeworks\.org\/where-find-us\/">Organization for Transformative Works' news outlets<\/a> for updates on our other projects!\s*$/s,
					'在 Bluesky 或 Tumblr 上关注 AO3 以获取最新动态；同时别忘了查看<a href="https://www.transformativeworks.org/where-find-us/">再创作组织的动态发布渠道</a>，了解我们其她项目的进展！'
				],
				[
					'p.jump',
					/^\s*\(See the end of the work for\s*(<a[^>]+>)(more )?notes(<\/a>)\s+and\s+(<a[^>]+>)other works inspired by this one(<\/a>)\.\)\s*$/s,
					(_match, p1, p2, p3, p4, p5) => `（在作品结尾查看${p1}${p2 ? '更多' : ''}注释${p3}和${p4}相关衍生作品${p5}。）`
				],
				[
					'div.flash.notice',
					/^\s*This work was added to your <a href="([^"]*)">Marked for Later list<\/a>\.\s*$/s,
					'已将此作品添加至<a href="$1">稍后阅读列表</a>。'
				],
				[
					'h4.viewed.heading',
					/^\s*\(Deleted work, last visited (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\)\s*$/s,
					(_match, day, month, year) => `作品已删除，上次阅读：${year}年${monthMap[month]}月${day}日`
				],
				[
					'div.flash.notice li',
					/^\s*You are previewing the skin (.*?)\. This is a randomly chosen page\.\s*$/,
					'您正在预览界面：$1。这是一个随机选择的页面。'
				],
				[
					'div.flash.notice li',
					/^\s*Go back or click any link to remove the skin\.\s*$/,
					'返回或点击任意链接以移除此界面。'
				],
				[
					'div.flash.notice li',
					/^\s*Tip: You can preview any archive page you want by tacking on '\?site_skin=\[skin_id\]' like you can see in the url above\.\s*$/,
					'提示：您可以通过在 URL 末尾添加 “?site_skin=[skin_id]” 来预览任意 Archive 页面，如上方地址栏所示。'
				],
				[
					'div.flash.notice li a',
					/^\s*Return To Skin To Use\s*$/,
					'返回界面以使用'
				],
				[
					'div.flash.alert',
					/^You are already logged in to an account\. Please log out and try again\.$/,
					'您已登录账户，请登出后重试。'
				],
				[
					'p',
					/^\s*The creator's summary is added automatically\.\s*$/s,
					'创作者的简介会自动添加'
				],
				[
					'p',
					/^\s*If you've forgotten your password, we can send you an email with instructions to reset your password\.\s*$/s,
					'如果您忘记了密码，我们可以发送包含重置密码说明的邮件。'
				],
				[
					'p',
					/^\s*Please enter the email address associated with your AO3 account\. You may only request a password reset a limited number of times per day\.\s*$/s,
					'请输入与您的 AO3 账户关联的电子邮箱地址。您每天只能请求有限次数的密码重置。'
				],
				[
					'div.caution.notice',
					/<p>\s*<strong>Please use this feature with caution\.<\/strong>\s*You can change your username once every 7 days\.\s*<\/p>/s,
					'<p><strong>请谨慎使用此功能。</strong>用户名每 7 天仅能更改一次。</p>'
				],
				[
					'span#more_pseuds_connector',
					/^\s*,\s+and\s*$/s,
					'，和 '
				],
				[
					'dd.pseuds',
					/(<\/a>),\s+(<a)/g,
					'$1，$2'
				],
				[
					'dd.pseuds',
					/(<a[^>]+>.*?<\/a>)\s+and\s+(<a[^>]+>.*?<\/a>)/i,
					'$1 和 $2'
				],
				[
					'div.flash.error',
					/^\s*Your password was incorrect\. Please try again or, if you've forgotten your password, log out and reset your password via the link on the login form\. If you are still having trouble, <a href="\/support">contact Support<\/a> for help\.\s*$/s,
					'您的密码不正确。请重试，如果您忘记了密码，请登出并通过登录表单上的链接重置密码。如果问题仍然存在，请<a href="/support">联系支持团队</a>寻求帮助。'
				],
				[
					'p.notice',
					/^\s*Sorry, you can't comment on a draft\.\s*$/s,
					'抱歉，您无法评论草稿。'
				],
				[
					'div.flash.alert',
					/^\s*The password or username you entered doesn't match our records\. Please try again or <a href="([^"]+)">reset your password<\/a>\. If you still can't log in, please visit <a href="([^"]+)">Problems When Logging In<\/a> for help\.\s*$/s,
					'您输入的用户名或密码与我们的记录不符。请重试或<a href="$1">重置密码</a>。若仍无法登录，请访问<a href="$2">登录问题</a>寻求帮助。'
				],
				['h2', /Shields are up!/, '安全防御已启动！'],
				['p', /We apologize for the interruption, please prove that you are not a robot:/, '很抱歉打扰您，请证明您不是机器人：'],
				['small', /<b>Your IP:<\/b>\s*<a([^>]+)>Show IP<\/a>/, '<b>您的 IP:</b> <a$1>显示 IP</a>'],
				['div.flash.notice', /^Invitation resent to (.+?)\.$/, '邀请已重新发送至 $1 。'],

				// 标签说明
				[
					'p',
					/^\s*This tag belongs to the (Fandom|Relationship|Character|Category|Archive Warning|Rating|Additional Tags) Category\.(\s*It's a <a href="\/faq\/glossary#canonicaldef">(?:canonical tag|规范标签)<\/a>[\.。]\s*You can use it to <a href="([^"]+)">(?:filter works|筛选作品)<\/a> and to <a href="([^"]+)">(?:filter bookmarks|筛选书签)<\/a>[\.。]\s*(\s*You can also access a list of <a href="([^"]+)">(?:Relationship tags in this fandom|此同人圈中的关系标签)<\/a>\s*)?[\.。]?)?\s*$/s,
					(_match, category, canonicalPart, worksLink, bookmarksLink, relationshipPart, relationshipLink) => {
						const categoryMap = {
							'Fandom': '同人圈',
							'Relationship': '关系',
							'Character': '角色',
							'Category': '分类',
							'Archive Warning': 'Archive 预警',
							'Rating': '分级',
							'Additional Tags': '附加标签'
						};
						const translatedCategory = categoryMap[category] || category;
						let result = `此标签属于“${translatedCategory}”类别。`;
						if (canonicalPart) {
							result += `这是一个<a href="/faq/glossary#canonicaldef">规范标签</a>。您可以用它来<a href="${worksLink}">筛选作品</a>和<a href="${bookmarksLink}">筛选书签</a>。`;
							if (relationshipPart && relationshipLink) {
								result += `您也可以访问<a href="${relationshipLink}">此同人圈中的关系标签</a>列表。`;
							}
						}
						return result;
					}
				],
				[
					'div.merger > h3.heading',
					/^Mergers$/,
					'合并'
				],
				[
					'div.merger p',
					/^\s*(')?([^'<]+)(')?\s+has been made a synonym of (<a class="tag"[^>]*>.*<\/a>)\.\s*Works and bookmarks tagged with ('?)([^'<]+)(')?\s+will show up in (.*)'s filter\.\s*$/s,
					(_match, quote1, tag1, _quote2, tag2Link, quote3, tag3, _quote4, tag4) => {
						const displayTag1 = quote1 ? `'${tag1}'` : tag1;
						const displayTag3 = quote3 ? `'${tag3}'` : tag3;
						return `${displayTag1} 已被设为 ${tag2Link} 的同义标签。使用 ${displayTag3} 标签的作品和书签将会在 ${tag4} 的筛选结果中显示。`;
					}
				],
				[
					'p.caution.notice',
					/^\s*Are you sure you want to <strong><em>delete<\/em><\/strong> all your subscriptions\? This <strong>cannot be undone<\/strong>\s*[.。]?\s*$/s,
					'您确定要<strong>删除</strong>所有订阅吗？此操作<strong>无法撤销</strong>。'
				]
			],
			'regexp': [
				[/^(\d+) kudos$/, '$1 个赞'],
				[/^(\d+) bookmark(?:s)?$/, '$1 条书签'],
				[/^(\d+) comment(?:s)?$/, '$1 条评论'],
				[/^(\d+) hit(?:s)?$/, '$1 次点击'],
				[/^(\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/,
					(match, p1, p2, p3) => `${p3}年${monthMap[p2]}月${p1}日`
				],
				[/^Your work (.*) was deleted\.$/, '您的作品 $1 已被删除。'],
				[/^Unsubscribe from (.*)$/, '取消订阅 $1']
			],
			'selector': [
				['#tos_prompt button[name=commit]', '我同意并已阅读服务条款'],
				['.actions a.comment_form_placement_open', '评论'],
				['#main .comment_error', '评论不能为空白。'],
				['.post.comment .submit input[type=submit]', '评论'],
				['form#new_comment .actions input[name=commit]', '评论'],
				['#kudo_submit', '点赞'],
				[/^Chapter (\d+)$/, '第 $1 章']
			]
		},

		'flexible': {

			'You searched for:': '您搜索了：',
			'Moderated': '审核制',
			'Unmoderated': '非审核制',
			'Unrevealed': '未揭晓',
			'Anonymous': '匿名',
			'Gift Exchange Challenges': '赠文交换活动',
			'Gift Exchange Challenge': '赠文交换活动',
			'Prompt Meme Challenges': '接梗挑战',
			'Prompt Meme Challenge': '接梗挑战',
			'Bookmarked Items': '已创建书签作品',

			'Not Rated': '未分级',
			'No rating': '未分级',
			'No category': '未分类',
			'General Audiences': '全年龄',
			'Teen And Up Audiences': '青少年及以上',
			'Mature': '成人向',
			'Explicit': '限制级',

			'F/F': '女/女',
			'F/M': '女/男',
			'Gen': '无CP',
			'M/M': '男/男',
			'Multi-Fandom': '跨圈',
			'Original Work': '原创作品',
			'Multi': '多配对',
			'Choose Not To Use Archive Warnings': '不使用 Archive 预警',
			'Creator Chose Not To Use Archive Warnings': '不使用 Archive 预警',
			'No Archive Warnings Apply': ' Archive 预警不适用',
			'Graphic Depictions Of Violence': '暴力场景描写',
			'Major Character Death': '主要角色死亡',
			'Underage Sex': '未成年性行为',
			'Rape/Non-Con': '强暴/非自愿性行为',

		},
		'common': {
			'static': {},
			'regexp': [],
			'selector': []
		},
		'front_page': {
			'static': {
				'What is AO3?': 'AO3 是什么？',
				'Follow @AO3_Status on Twitter for news and updates!': '在 Twitter 上关注 @AO3_Status 获取新闻和更新！',
			},
			'regexp': [],
			'selector': [
				['.front.home-banner .heading a', '进入 AO3'],
			]
		},
		// 作品搜索
		'works_search': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		'works_search_results': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		// 用户搜索
		'people_search': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		'people_search_results': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		// 书签搜索
		'bookmarks_search': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		'bookmarks_search_results': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		// 标签搜索
		'tags_search': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		'tags_search_results': {
			'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		'dashboard': {
			'static': {
			},
			'regexp': [],
			'selector': []
		},
		'profile': {
			'static': {
				'User Profile': '用户资料',
				'My Pseud': '我的笔名',
				'Pseuds': '笔名',
				'Joined': '加入日期',
				'Bio': '个人简介',
				'Dismiss permanently': '永久关闭此信息',
				'Hide first login help banner': '隐藏首次登录帮助横幅',
				'×': '×',
			},
			'innerHTML_regexp': [
				['p.alt.message',
					/^\s*You don't have anything posted under this name yet\.\s*Would you like to\s*<a (href="\/works\/new")>post a new work<\/a>\s*or maybe\s*<a (href="\/external_works\/new")>a new bookmark<\/a>\s*\?\s*$/s,
					'您还没有以这个笔名发布任何作品。您想要<a $1>发布新作品</a>或者创建<a $2>一个新的书签</a>吗？'
				]
			],
			'regexp': [],
			'selector': []
		},
		'works_edit': {
			'static': {
				'Edit Work': '编辑作品',
				'Add Chapter': '添加章节',
				'Edit Chapter:': '编辑章节:',
			},
			'regexp': [], 'selector': [], 'innerHTML_regexp': []
		},
		'works_new': {
			'static': {
				'Post New Work': '发布新作品',
				'Import From An Existing URL Instead?': '从现有 URL 导入',
				'* Required information': '* 处为必填信息',
				'Tags are comma separated, 150 characters per tag. Fandom, relationship, character, and additional tags must not add up to more than 75. Archive warning, category, and rating tags do not count toward this limit.': '标签以逗号分隔，每个标签最多 150 字符。同人圈、关系、角色及附加标签总计不得超过 75 字符。Archive 预警、分类及分级标签不计入此限制。',
				'Rating*': '分级*',
				'Archive Warnings*': 'Archive 预警*',
				'Fandoms*': '同人圈*',
				'If this is the first work for a fandom, it may not show up in the fandoms page for a day or two.': '如果这是该同人圈的第一篇作品，可能需要一两天才会出现在同人圈页面。',
				'Preface': '前言',
				'Work Title*': '作品标题*',
				'We need a title! (At least 1 character long, please.)': '需要一个标题！(请至少输入 1 个字符)',
				'Add co-creators?': '添加共创者？',
				'at the beginning': '在开头',
				'at the end': '在结尾',
				'End Notes': '尾注',
				'Associations': '关联',
				'Post to Collections / Challenges': '发布到合集/挑战',
				'Gift this work to': '将此作品赠送给',
				'This work is a remix, a translation, a podfic, or was inspired by another work': '此作品为改编、译作、有声读物或衍生自另一作品',
				'This work is part of a series': '此作品为一个系列的一部分',
				'This work has multiple chapters': '此作品包含多个章节',
				'Set a different publication date': '设置一个不同的发布日期',
				'Choose a language *': '选择语言*',
				'Please select a language': '请选择语言',
				'Select work skin': '选择作品界面',
				'Basic Formatting': '基本界面',
				'Homestuck Skin': 'Homestuck 界面',
				'Undertale Work Skin': 'Undertale 界面',
				'Only show your work to registered users': '仅向注册用户展示',
				'Enable comment moderation': '启用评论审核',
				'Registered users and guests can comment': '注册用户及游客可评论',
				'Only registered users can comment': '仅注册用户可评论',
				'No one can comment': '禁止评论',
				'Work Text*': '作品正文*',
				'Rich Text': '富文本',
				'Preview': '预览',
				'Brevity is the soul of wit, but your content does have to be at least 10 characters long.': '简洁乃智慧之魂，但您的内容长度必须至少 10 个字符。',
				'Sorry! We couldn\'t save this work because:': '抱歉！我们无法保存此作品，因为：', 'Language cannot be blank.': '语言不能为空。', 'Please fill in at least one fandom.': '请至少填写一个同人圈。', 'Please select at least one warning.': '请至少选择一个预警。',
				'For a work in the Archive, only the URL is required.': '对于 Archive 站内的作品，仅需填写 URL。',
				'This is a translation': '这是一个译本',
				'Choose one of your existing series:': '选择一个您已有的系列：',
				'Please select': '请选择',
				'Or create and use a new one:': '或创建并使用一个新系列：',
				'Chapter Title:': '章节标题：',
				'Set publication date': '设置发布日期',
			},
			'innerHTML_regexp': [
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
				['fieldset.work.text p.notice', /<strong>Note:<\/strong> Text entered in the posting form is <strong>not<\/strong> automatically saved\. Always keep a backup copy of your work\./s, '<strong>注意：</strong>在发布表单中输入的文本<strong>不会</strong>自动保存。请务必保留作品的备份。'],
				[
					'fieldset.create p.notice',
					/All works you post on AO3 must comply with our <a href="\/content">(Content Policy|内容政策)<\/a>\. For more information, please refer to our <a href="\/tos_faq#content_faq">(?:Terms of Service FAQ|服务条款常见问题)<\/a>\./s,
					'您在 AO3 发布的所有作品均必须遵守我们的<a href="/content">内容政策</a>。更多信息请参阅我们的<a href="/tos_faq#content_faq">服务条款常见问题</a>。'
				],
			],
			'regexp': [],
			'selector': [
				['dt.permissions.comments', '谁可以评论此作品'],
				['#chapters-options label[for="work_wip_length"]', '第 1 章 / 共']
			]
		},
		'works_import': {
			'static': {
				'Import New Work': '导入新作品',
				'Please note! Fanfiction.net, Wattpad.com, and Quotev.com do not allow imports from their sites.': '请注意！FanFiction.net、Wattpad.com 和 Quotev.com 不允许从其站点导入内容。',
				'Post New Work Instead?': '改为发布新作品',
				'Works URLs': '作品 URL',
				'Rating*': '分级*',
				'Archive Warnings*': 'Archive 预警*',
				'Fandoms*': '同人圈*',
				'Choose a language*': '选择语言*',
				'Please select a language': '请选择语言',
				'Set custom encoding': '设置自定义编码',
				'Import as': '作为以下内容导入',
				'Works (limit of 25)': '作品（限 25 个）',
				'Chapters in a single work (limit of 200)': '单部作品的多个章节（限 200 个）',
				'Preferences': '偏好设置',
				'Post without previewing.': '不预览直接发布。',
				'Override tags and notes': '覆盖标签和说明',
				'Enable comment moderation': '启用评论审核',
				'Registered users and guests can comment': '注册用户及游客可评论',
				'Only registered users can comment': '仅注册用户可评论',
				'No one can comment': '禁止评论',
				'Set the following tags and/or notes on all works, overriding whatever the importer finds in the content.': '对所有导入的作品设置以下标签和/或说明，覆盖导入工具从内容中提取的信息。',
				'Use values extracted from the content for blank fields if possible': '如果可能，对空白字段使用从内容中提取的值',
				'Do not use values extracted from the content at all; use Archive defaults for blank fields': '完全不使用从内容中提取的值；对空白字段使用 Archive 默认值',
				'Only show imported works to registered users': '仅向注册用户展示导入的作品',
				'Notes at the beginning': '将注释放在开头',
				'Submit': '提交',
				'Import': '导入'
			},
			'innerHTML_regexp': [
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
				[
					'div.notice p',
					/You might find the <a href="\/faq\/posting-and-editing#importwork">Import FAQ<\/a> useful\./s,
					'<a href="/faq/posting-and-editing#importwork">导入常见问题</a>可能会对您有所帮助。'
				],
				[
					'p.footnote#url-field-description',
					/URLs for existing work\(s\) or for the chapters of a single work; <strong>one URL per line\.<\/strong>/s,
					'现有作品或单部作品各章节的 URL ；<strong>每行一个 URL 。</strong>'
				],
				[
					'p.note',
					/Tags are comma separated, 150 characters per tag\. Fandom, relationship, character, and additional tags must not add up to more than 75\. Archive warning, category, and rating tags do not count toward this limit\./s,
					'标签以逗号分隔，每个标签最多 150 字符。同人圈、关系、角色及附加标签总计不得超过 75 字符。Archive 预警、分类及分级标签不计入此限制。'
				],
				[
					'p.footnote',
					/If this is the first work for a fandom, it may not show up in the fandoms page for a day or two\./s,
					'如果这是该同人圈的第一篇作品，可能需要一两天才会出现在同人圈页面。'
				],
				[
					'fieldset p.notice',
					/All works you post on AO3 must comply with our <a href="\/content">(Content Policy|内容政策)<\/a>\. For more information, please refer to our <a href="\/tos_faq#content_faq">(?:Terms of Service FAQ|服务条款常见问题)<\/a>\./s,
					'您在 AO3 发布的所有作品均必须遵守我们的<a href="/content">内容政策</a>。更多信息请参阅我们的<a href="/tos_faq#content_faq">服务条款常见问题</a>。'
				],
			],
			'regexp': [],
			'selector': [
				['dt.permissions.comments', '谁可以评论此作品']
			]
		},
		'chapters_new': {
			'static': {
				'Post New Chapter': '发布新章节',
				'Name, Order and Date': '名称、顺序和日期',
				'Chapter Title': '章节标题',
				'Chapter Number': '章节编号',
				'Chapter Publication Date': '章节发布日期',
				'Chapter Preface': '章节前言',
				'Chapter Summary': '章节简介',
				'Chapter Notes': '章节注释',
				'End Notes': '尾注',
				'Chapter Text*': '章节正文*',
				'Post Chapter': '发布章节',
				'Warning: Unchecking this box will delete the existing beginning note.': '警告：取消勾选此框将删除已有的开头注释。',
				'Warning: Unchecking this box will delete the existing end note.': '警告：取消勾选此框将删除已有的结尾注释。'
			},
			'selector': [
				['label[for="chapter_wip_length"]', '共']
			]
		},
		'works_edit_tags': {
			'static': {
				'Post Work': '发布作品',
				'Update': '更新'
			},
			'innerHTML_regexp': [
				[
					'h2.heading',
					/^\s*Edit Work Tags for (.*)\s*$/s,
					'编辑作品标签：$1 '
				]
			],
			'selector': []
		},
		'chapters_edit': {
			'static': {}
		},
		'orphans_new': {
			'static': {
				'Take my pseud off as well': '同时移除我的笔名',
				'Leave a copy of my pseud on': '保留我的笔名副本',
				'Read More About The Orphaning Process': '阅读更多关于匿名流程的信息',
				'Yes, I\'m sure': '是的，我确定'
			},
			'innerHTML_regexp': [
				[
					'p.caution.notice',
					/Orphaning will\s*<strong>permanently<\/strong>\s*remove all identifying data from the following work\(s\), their chapters, associated series, and any feedback replies you may have left on them\./s,
					'匿名化操作将<strong>永久</strong>移除以下作品、其章节、关联系列以及您可能留下的任何反馈回复中的所有身份识别信息。'
				],
				[
					'p.caution.notice',
					/Orphaning a work removes it from your account and re-attaches it to the specially created orphan_account\. Please note that this is\s*<strong>permanent and irreversible\.<\/strong>\s*You are giving up control over the work,\s*<strong>including the ability to edit or delete it\.<\/strong>/s,
					'匿名化作品会将其从您的账户中移除，并重新关联至专门创建的 orphan_account（匿名帐户）。请注意，此操作是<strong>永久且不可逆的。</strong>您将放弃对该作品的控制权，<strong>包括编辑或删除它的能力。</strong>'
				],
				[
					'p.caution.notice',
					/Are you\s*<strong>really<\/strong>\s*sure you want to do this\?/s,
					'您<strong>真的</strong>确定要这样做吗？'
				]
			],
			'selector': []
		},
		'works_show_multiple': {
			'static': {
				'Edit Multiple Works': '编辑多个作品',
				'You have no works or drafts to edit.': '您没有可编辑的作品或草稿。',
				'All': '全选',
				'None': '取消勾选',
				'Actions': '操作',
				'Orphan': '匿名化'
			},
			'innerHTML_regexp': [
				[
					'fieldset.fandom.listbox > legend',
					/^Select (.*) works$/s,
					'选择 $1 的作品'
				]
			],
			'regexp': [
				[/\(Draft\)$/, '（草稿）']
			]
		},
		'works_edit_multiple': {
			'static': {
				'Edit Multiple Works': '编辑多个作品',
				'Visibility': '可见性',
				'Keep current visibility settings': '保持当前可见性设置',
				'Show to all': '对所有人可见',
				'Only show to registered users': '仅向注册用户展示',
				'Comment moderation': '评论审核',
				'Keep current comment moderation settings': '保持当前评论审核设置',
				'Disable comment moderation': '禁用评论审核',
				'Who can comment on these works': '谁可以评论这些作品',
				'Keep current comment settings': '保持当前评论设置',
				'Add co-creators': '添加共创者',
				'Choose a language': '选择语言',
				'Update All Works': '更新所有作品',
				'Are you sure? Remember this will replace all existing values!': '您确定吗？请记住，此操作将替换所有现有值！'
			},
			'innerHTML_regexp': [
				[
					'p.caution.notice',
					/^\s*Your edits will be applied to <strong>.*?<\/strong> of the following works:\s*$/s,
					'您的编辑将应用于以下<strong>全部</strong>作品：'
				],
				[
					'p.caution.notice',
					/^\s*Your edits will <strong>replace<\/strong> the existing values!\s*\(If you leave a field blank it will remain unchanged\.\)\s*$/s,
					'您的编辑将<strong>替换</strong>现有值（如果将字段留空，则不会进行更改）。'
				]
			]
		},
		'users_invitations': {
			'flexible': {
				'Unsent': '未发送',
				'Sent But Unused': '已发送但未使用',
				'Used': '已使用',

			},
			'static': {
				'Invite a friend': '邀请好友',
				'Invitations': '邀请',
				'Manage Invitations': '管理邀请',
				'Request Invitations': '获取邀请',
				'Your Invitations': '您的邀请',
				'Manage:': '管理：',
				'All': '全部'
			},
			'innerHTML_regexp': [
				['div.module p', /Sorry, you have no unsent invitations right now\. <a href="\/user_invite_requests\/new">Request invitations<\/a>/s, '抱歉，您当前没有未发送的邀请。<a href="/user_invite_requests/new">获取邀请</a>']
			]
		},
		'users_common': {
			'static': {
				'Profile': '个人资料',
			},
		},
		'users_settings': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
		},
		'users_block_mute_list': {
			'static': {
				'Blocked Users': '已屏蔽用户',
				'Muted Users': '已静音用户',
				'Block a user': '屏蔽用户',
				'Mute a user': '静音用户',
				'Block': '屏蔽',
				'Mute': '静音',
				'Unblock': '取消屏蔽',
				'Unmute': '取消静音',
				'You have not muted any users.': '您尚未静音任何用户。',
				'You have not blocked any users.': '您尚未屏蔽任何用户。'
			},
			'innerHTML_regexp': [
				[
					'div.notice',
					/^\s*<p>You can block up to 2,000 users\. Blocking a user prevents them from:<\/p>[\s\S]*?<a href="(\/users\/[^\/]+\/muted\/users)">your Muted Users page<\/a>\.<\/p>\s*$/s,
					`<p>您最多可以屏蔽 2,000 位用户。屏蔽用户后，她们将无法：</p>
                        <ul>
                        <li>在您的作品上发表评论或留下点赞</li>
                        <li>在站点任何地方回复您的评论</li>
                        <li>在活动分配和认领同人梗之外赠送作品给您</li>
                        </ul>
                        <p>屏蔽用户不会：</p>
                        <ul>
                        <li>隐藏您所屏蔽用户的作品或书签</li>
                        <li>删除或隐藏她们之前在您作品上留下的评论；您可以逐条删除</li>
                        <li>隐藏她们在站点其她地方的评论</li>
                        </ul>
                        <p>如需隐藏某用户的作品、书签、系列和评论，请访问<a href="$1">已静音用户页面</a>。</p>`
				],
				[
					'div.notice',
					/^\s*<p>You can mute up to 2,000 users\. Muting a user:<\/p>[\s\S]*?<a href="(\/users\/[^\/]+\/blocked\/users)">your Blocked Users page<\/a>\.[\s\S]*?<a href="(\/faq\/skins-and-archive-interface#restoresiteskin)">instructions for reverting to the default site skin<\/a>\.\s*<\/p>\s*$/s,
					`<p>您最多可静音 2,000 位用户。静音用户后：</p>
                        <ul>
                        <li>她们的作品、系列、书签和评论将完全对您隐藏；不会留下空白空间、占位文本或其她任何提示</li>
                        </ul>
                        <p>静音用户不会：</p>
                        <ul>
                        <li>阻止您接收来自该用户的评论或订阅邮件</li>
                        <li>将她们的内容隐藏给其她任何人</li>
                        </ul>
                        <p>如需阻止某用户在您的作品上发表评论或在站点其她地方回复您的评论，请访问<a href="$1">已屏蔽用户页面</a>。</p>
                        <p>请注意，如果您未使用默认站点界面，静音功能可能无法正常工作。要了解有关<a href="$2">如何恢复默认站点界面</a>的说明，请参阅界面与 Archive 界面常见问题 。</p>`
				]
			],
			'regexp': [],
			'selector': []
		},
		'preferences': {
			'static': {
				'Edit My Preferences': '编辑我的偏好设置',
				'Privacy': '隐私设置',
				'Interface': '界面设置',
				'Work Display': '作品显示',
				'Site Skins': '站点界面',
				'When I post a work, credit me as:': '当我发布作品时，署名方式：',
				'Show': '显示',
				'Hide': '隐藏',
				'Turn on Creator Styles': '启用创作者界面样式',
				'Update': '确定',
			},
			'regexp': [],
			'selector': []
		},
		'skins': {
			'static': {
				'Public Site Skins': '公共站点界面',
				'Create Site Skin': '创建新界面',
				'Edit Skin': '编辑界面',
				'Description': '描述',
				'Use': '使用',
				'Preview': '预览',
				'Set For Session': '为本次会话设置',
				'Create New Skin': '创建新界面',
				'Write Custom CSS': '编写自定义 CSS',
				'Use Wizard': '使用向导',
				'* Required information': '* 处为必填信息',
				'Type*': '类型*',
				'Title*': '标题*',
				'Site Skin': '站点界面',
				'Work Skin': '作品界面',
				'Upload a preview (png, jpeg or gif)': '上传预览（PNG、JPEG 或 GIF）',
				'Apply to make public': '应用并公开',
				'Advanced': '高级',
				'Show ↓': '显示 ↓',
				'Hide ↑': '隐藏 ↑',
				'Conditions': '条件',
				'What it does:': '作用：',
				'add on to archive skin': '添加到 Archive 界面',
				'replace archive skin entirely': '完全替换 Archive 界面',
				'IE Only:': '仅限 IE：',
				'Parent Only:': '仅限母级：',
				'Media:': '媒体：',
				'Choose @media': '选择 @media',
				'Parent Skins': '母级界面',
				'Add parent skin': '添加母级界面',
				'Actions': '操作',
				'Submit': '提交',
				'Site Skin Wizard': '站点界面向导',
				'Fonts and Whitespace': '字体与留白',
				'Font': '字体',
				'Colors': '颜色设置',
				'Percent of browser font size': '浏览器字体大小百分比',
				'Work margin width': '作品页边距宽度',
				'Vertical gap between paragraphs': '段落垂直间距',
				'Background color': '背景色',
				'Text color': '文字颜色',
				'Header color': '页眉颜色',
				'Accent color': '强调色',
				'This form allows you to create a new site or work skin. Select "Work Skin" or "Site Skin" in the Type option list to choose which type of skin you are creating.': '此表单允许您创建新的站点或作品界面。在“类型”选项列表中选择“作品界面”或“站点界面”以指定创建的界面类型。',
			},
			'innerHTML_regexp': [
				['p.notes', /^\s*This wizard only creates site skins\.\s*You can also <a href="\/skins\/new\?skin_type=WorkSkin">create a work skin<\/a> which can be used to add styling to works that you post\.\s*<a[^>]*><span class="symbol question"><span>\?<\/span><\/span><\/a>\s*$/, '此向导仅创建站点界面。您也可以<a href="/skins/new?skin_type=WorkSkin">创建作品界面</a>，用于为您发布的作品添加样式。<a class="help symbol question modal modal-attached" title="Skins basics" href="/help/skins-basics.html" aria-controls="modal"><span class="symbol question"><span>?</span></span></a>'],
				['p.notes', /^\s*You may wish to refer to this <a href="https:\/\/www\.w3schools\.com\/colors\/colors_names\.asp">handy list of colors<\/a>\.\s*$/, '您可以参考这份<a href="https://www.w3schools.com/colors/colors_names.asp">实用的颜色列表</a>。'],
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
				['p.footnote#font-field-notes', /^\s*Comma-separated list of font names\.\s*$/, '以逗号分隔的字体名称列表。'],
				['p.footnote#base-em-field-notes', /^\s*Numbers only, treated as a percentage of the browser's default font size\. Default: <code>100<\/code>\s*$/, '仅限数字，表示相对于浏览器默认字体大小的百分比。默认值：<code>100</code>'],
				['p.footnote#margin-field-notes', /^\s*Numbers only, treated as a percentage of the page width\.\s*$/, '仅限数字，表示相对于页面宽度的百分比。'],
				['p.footnote#paragraph-margin-field-notes', /^\s*Numbers only, treated as a multipler of the paragraph font size\. Default: <code>1\.286<\/code>\s*$/, '仅限数字，表示相对于段落字体大小的倍数。默认值：<code>1.286</code>'],
				['p.footnote#background-color-field-notes', /^\s*Name or hex code\. Default: <code>#fff<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#fff</code>'],
				['p.footnote#foreground-color-field-notes', /^\s*Name or hex code\. Default: <code>#2a2a2a<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#2a2a2a</code>'],
				['p.footnote#header-color-field-notes', /^\s*Name or hex code\. Default: <code>#900<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#900</code>'],
				['p.footnote#accent-color-field-notes', /^\s*Name or hex code\. Default: <code>#ddd<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#ddd</code>']
			],
			'regexp': [
				[/^Must be present\.$/, '必须提供']
			],
			'selector': []
		},
		'users_works_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_drafts_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_series_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_bookmarks_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_collections_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_subscriptions_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_related_works_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_gifts_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': [],
		},
		'users_signups': {
			'static': {
				'Challenge Sign-ups': '挑战活动报名'
			},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': []
		},
		'users_stats': {
			'static': {
				'Navigation and Sorting': '导航与排序',
				'Stats': '数据统计',
				'All Years': '所有年份',
				'Totals': '总计',
				'User Subscriptions:': '用户订阅:',
				'Comment Threads:': '评论串:',
				'Subscriptions:': '作品订阅:',
				'View Sorting and Actions': '视图排序与操作',
				'Fandoms View': '同人圈视图',
				'Flat View': '平铺视图',
				'Listing Statistics': '列表统计',
				'Comment Threads': '评论串',
				'Subscriptions': '订阅列表'
			},
			'innerHTML_regexp': [
				['span.words', /^\(([\d,]+)\s+words\)$/s, '（$1 字）']
			],
			'regexp': [],
			'selector': []
		},
		'works_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': []
		},
		'works_show': {
			'static': {
				'Download': '下载',
				'Subscribe': '订阅',
				'Unsubscribe': '取消订阅',
				'kudos': ' 个赞',
				'Comments': '评论',
				'Chapter Notes': '章节注释',
				'Work Notes': '作品注释',
				'End Notes': '章节尾注',
				'Inspired by': '灵感来源于',
			},
			'innerHTML_regexp': [],
			'regexp': [
				[/^Chapter (\d+) of (\d+)$/, '第 $1 章 / 共 $2 章'],
				[/^Chapter (\d+)$/, '第 $1 章'],
			],
			'selector': [
				['#workskin .preface .notes .landmark', '注释'],
			]
		},
		'series_index': {
			'static': {}, 'innerHTML_regexp': [], 'regexp': [], 'selector': []
		},
		'series_show': {
			'static': {
				'Works in Series': '系列中的作品',
				'Series Begun': '系列开始于',
				'Series Updated': '系列更新于',
				'Words': '总字数',
				'Description': '系列描述',
			},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': []
		},
		'tags_index': {
			'static': {
				'Canonical Tags': '规范标签',
				'Uncategorized Tags': '未分类标签',
				'Browse Tags': '浏览标签',
			},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': []
		},
		'tags_show': {
			'static': {
				'Works in Tag': '此标签下的作品',
				'Filter': '筛选',
				'Related Tags': '相关标签',
				'Meta Tag': '元标签',
				'Sub Tag': '子标签',
				'Synonymous Tag': '同义标签',
			},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': []
		},
		'tag_sets_index': {
			'static': {
				'New Tag Set': '新建标签集',
				'Nominate': '提名',

			},
			'innerHTML_regexp': [
				['dl.stats', /(Fandoms:|Characters:|Relationships:|Additional Tags:)/g, (match) => {
					const translationMap = {
						'Fandoms:': '同人圈：',
						'Characters:': '角色：',
						'Relationships:': '关系：',
						'Additional Tags:': '附加标签：'
					};
					return translationMap[match] || match;
				}]
			],
			'regexp': [],
			'selector': []
		},
		'tag_sets_nominations_new': {
			'flexible': {
				'Relationship': '关系',
			},
			'static': {
				// 表单区域标题
				'Basic Information': '基本信息',
				'Submit': '提交',
				'Tag Nominations': '标签提名',
				'Nominate Tags Form': '提名标签表单',
				'Fandom?': '同人圈？',

				// 标签与提示
				'Nominating For:': '提名对象：',
				'Pseud:': '笔名：',

				// 页面说明文字
				'The autocomplete lists canonical tags for you. Please choose the canonical version of your tag if there is one.': '自动补全列表会为您列出规范标签。如存在规范版本，请选择。',
				'The tag set moderators might change or leave out your nominations (sometimes just because a different form of your nomination was included).': '标签集管理员可能会更改或忽略您的提名（有时仅因已收录了另一种形式）。',
				'Nominations are not forever! Don\'t be confused if you come back in a few months and they are gone: they may have been cleaned up.': '提名并非永久保留！几个月后回来如发现提名消失，请勿感到困惑：可能已被清理。',
				'If crossover relationships are allowed, you can enter them under either fandom.': '若允许跨圈关系，可在任一同人圈下输入。',

				'Specifying Fandom': '指定同人圈',
				'Tagset fandom for child': '子标签集同人圈',
				'Close': '关闭'
			},
			'innerHTML_regexp': [
				['h2.heading', /^Tag Nominations for (.*?)$/, '为 “$1” 提名标签'],
				['ul.navigation.actions a[href*="/tag_sets/"]', /^Back To (.*?)$/, '返回 “$1”'],
				['#modal .content.userstuff p',
					/^\s*You only need to specify the fandom if your nomination is new or not in the fandom already -- for instance, if you're\s*submitting a character who has just appeared in the fandom\.\s*This information is just used to help the moderators sort out new tags\.\s*$/s,
					'仅当您的提名为新标签或尚未存在于该同人圈时才需指定同人圈——例如，您提交的角色刚出现在该同人圈中。此信息仅用于帮助管理员整理新标签。'
				]
			],
			'regexp': [
				[/^You can nominate up to .*$/, translateNominationRule],

				[/^Fandom (\d+)$/, '同人圈 $1'],
				[/^Additional Tag (\d+)$/, '附加标签 $1']
			],
			'selector': []
		},
		'owned_tag_sets_show': {
			'flexible': {
				'Ratings': '分级',
				'Additional Tags': '附加标签',
				'Categories': '分类',
				'Warnings': '预警',
				'No Media': '无媒体',
				'Unassociated Characters & Relationships': '未关联的角色与关系',
			},
			'static': {
				'Nominate': '提名',
				'All Tag Sets': '所有标签集',
				'Created on:': '创建日期：',
				'Maintainers:': '维护者：',
				'Description:': '简介：',
				'Status:': '状态：',
				'Stats:': '统计数据：',
				'Nominations allowed per person:': '每人可提名数量：',
				'Expand All': '展开全部',
				'Contract All': '收起全部',
				'Medium: Fanfiction': '媒介：同人文',
				'The following characters and relationships don\'t seem to be associated with any fandom in the tagset. You might need to add the fandom, or set up associations for them.': '以下角色与关系似乎尚未与标签集中的任何同人圈关联。您可能需要添加所属同人圈，或为其建立关联。',
				'The moderators have chosen not to make the tags in this set visible to the public (possibly while nominations are underway).': '标签集管理员已选择暂不向公众展示此标签集中的标签（可能是因为提名正在进行中）。',
				'Metadata': '元数据',
				'Listing Tags': '标签列表',
			},
			'innerHTML_regexp': [
				['h2.heading', /^About (.*)$/, '关于 “$1”'],
				['dd', /<strong>Open<\/strong> to the public\./, '对公众开放。'],
				['dl.stats', /(Fandoms:|Characters:|Relationships:|Freeforms:)/g, (match) => {
					const translationMap = {
						'Fandoms:': '同人圈：',
						'Characters:': '角色：',
						'Relationships:': '关系：',
						'Freeforms:': '自由形式：'
					};
					return translationMap[match] || match;
				}],
			],
			'regexp': [
				[/^Medium: Art - Character$/, '媒介：画作-角色'],
				[/^Medium: Fanvid - Character$/, '媒介：同人视频-角色'],
				[/^Medium: Other - Character$/, '媒介：其她-角色'],
			],
			'selector': []
		},
		'tag_sets_new': {
			'static': {
				'Create A Tag Set': '创建标签集',
				'Back to Tag Sets': '返回标签集',
				'Management': '管理',
				'Description': '简介',
				'Nomination Limits': '提名限制',
				'Tags In Set': '标签集内标签',
				'Tags in Set': '标签集内标签',
				'Tag Associations': '标签关联',
				'Actions': '操作',
				'Ratings': '评级',
				'Tag sets are used for running a challenge.': '标签集用于举办挑战活动。',
				'"Visible" tag sets are shown to all users.': '“可见”标签集会向所有用户展示。',
				'"Usable" tag sets can be used by others in their challenges.': '“可用”标签集可供她人在其挑战中使用。',
				'Tag sets that are open to nominations can take nominations from the public.': '开放提名的标签集可接受公众提名。',
				'Tag names have to be unique. If necessary the archive may add on the tag type. (For instance, if you entered a character "Firefly", you\'d see "Firefly - Character" in your tag set instead since the tag Firefly is already used for the show.': '标签名称必须唯一。如有必要，Archive 会自动添加标签类型后缀。（例如，若您输入角色名“Firefly”，由于已有同名标签用于剧集，该标签会在您的标签集中显示为“Firefly - Character”。）',
				'Current Owners': '当前所有者',
				'Add/Remove Owners:': '添加/移除所有者：',
				'Current Moderators': '当前管理员',
				'Add/Remove Moderators:': '添加/移除管理员：',
				'Title* (text only)': '标题*（仅限文本）',
				'Brief Description': '简要描述',
				'Visible tag list?': '可见标签列表？',
				'Usable by others?': '可被她人使用？',
				'Currently taking nominations?': '当前接受提名？',
				'Fandom nomination limit': '同人圈提名限制',
				'Character nomination limit': '角色提名限制',
				'Relationship nomination limit': '关系提名限制',
				'Freeform nomination limit': '自由标签提名限制',
				'Add Fandoms:': '添加同人圈：',
				'Add Characters:': '添加角色：',
				'Add Relationships:': '添加关系：',
				'All': '全选',
				'None': '取消勾选',
				'Tag Set Associations': '标签集关联',
				'Tagset tag associations': '标签集：标签关联 帮助',
				'Close': '关闭'
			},
			'innerHTML_regexp': [
				['h4.heading > label[for*="freeform"]', /Add Additional Tags:/, '添加附加标签：'],
				['form > fieldset:nth-of-type(1) > p.notes', /^\s*To add or remove an owner or moderator, enter their name\. If they are already on the list they will be removed; if not, they will be added\.\s*You can't remove the sole owner of a tag set\.\s*$/, '要添加或移除所有者或管理员，请输入其用户名。若已在列表中则移除，否则将被添加。无法移除唯一所有者。'],
				['#nomination_limits .notes li:nth-of-type(1)', /If you allow <em>both<\/em> fandoms and characters\/relationships in the same tag set,\s*the number of characters\/relationships is <strong>per fandom<\/strong> 。/s, '如果您在同一标签集中同时允许提名同人圈和角色/关系，那么角色/关系的数量是<strong>按每个同人圈计算</strong>的。'],
				['#nomination_limits .notes li:nth-of-type(2)', /If that's not what you want, you\s*can have users nominate fandoms in one tag set, and characters\/relationships in another tag set\. Then use both tag sets in your challenge settings\./s, '如果这不是您想要的效果，您可以让用户在一个标签集中提名同人圈，在另一个标签集中提名角色/关系。然后在您的挑战设置中同时使用这两个标签集。'],
				['#modal .content.userstuff p:nth-of-type(1)', /Tag associations let you set up associations between the fandoms, characters, and relationships in your tag set, which then\s+lets your participants pick from only the characters and relationships in a given fandom\./s, '标签关联功能允许您在所选同人圈、角色和关系之间建立关联，从而让参与者仅从指定同人圈中的角色和关系中进行选择。'],
				['#modal .content.userstuff p:nth-of-type(2)', /Note: if the wranglers have already set up these associations, then you can just add the additional\s+ones that you would like -- you don't have to \(and in fact aren't allowed\) to create copies of canonical\s+associations\. You can still limit your participants' choices to tags actually in your set\./s, '注意：如果标签管理员已经建立了这些关联，您只需添加想要的关联即可——无需（且实际上也不被允许）复制已有的规范关联。您仍可将参与者的选项限制在标签集中已有的标签范围内。'],
				['#modal .content.userstuff p:nth-of-type(3)', /If you're not sure how this might work, try adding a few fandoms and characters and setting up some associations,\s+and then set up your challenge and try out the sign-up form!/s, '如果不确定此功能如何运作，请尝试添加一些同人圈和角色并建立关联，然后创建您的挑战活动并在报名表中进行测试！']
			],
			'regexp': [],
			'selector': []
		},
		'collections_index': {
			'flexible': {
				'Moderated': '审核制',
				'Fandoms': '同人圈',
				'Works': '作品',
				'Open,': '开放中,',
				'Closed,': '已截止,',
			},
			'static': {
				'Sign Up': '报名',
			},
			'innerHTML_regexp': [
				['h3.heading', /(\d+\s*-\s*\d+)\s+of\s+([\d,]+)\s+Collections/s, '第 $1 个，共 $2 个合集']
			],
			'regexp': [
				[/^You have applied to join (.*)\.$/, '您已申请加入 $1。'],
				[/^Removed (\w+) from collection\.$/, '已将 $1 从合集中移除。']
			],
			'selector': []
		},
		'bookmarks_index': {
			'static': {
				'My Bookmarks': '我的书签',
				'Recs': '推荐',
				'Private': '私密',
				'Public': '公开',
				'Notes & Tags': '笔记和标签',
				'Your tags': '标签',
				'The creator\'s tags are added automatically.': '创建者的标签会自动添加',
				'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
				'Add to collections': '添加到合集',
				'Private bookmark': '私人书签',
				'Create': '创建',
			},
			'innerHTML_regexp': [
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
			],
			'regexp': [],
			'selector': []
		},
		'bookmarks_show': {
			'static': {
				'Bookmark by': '书签创建者：',
				'Bookmarker\'s Tags': '书签创建者的标签',
				'Bookmarker\'s Notes': '书签创建者的注释',
			},
			'regexp': [],
			'selector': []
		},
		'collections_show': {
			'static': {
				'Collection by': '合集创建者',
				'Maintainers': '维护者',
				'Challenge': '挑战',
				'Gift Exchange': '赠文交换',
				'Prompt Meme': '接梗挑战',
				'Rules': '规则',
				'FAQ': '常见问题',
				'Sign-up': '报名',
				'Assignments': '任务中心',
				'Post to Collection': '发布到此合集',
			},
			'regexp': [],
			'selector': []
		},
		'collections_new': {
			'static': {
				'New Collection': '新建合集',
				'Suggestions': '建议',
				'New Collection Form': '新建合集表单',
				'* Required information': '* 处为必填信息',
				'Header': '页眉',
				'Collection name*': '合集名称*',
				'Display title*': '显示标题*',
				'Parent collection (that you maintain)': '母合集（由您维护）',
				'Collection email': '合集电子邮箱',
				'Custom header URL': '自定义页眉 URL',
				'Icon': '图标',
				'Upload a new icon': '上传新图标',
				'Icon alt text': '图标替代文本',
				'Icon comment text': '图标注释文本',
				'Brief description': '简要描述',
				'Preferences': '偏好设置',
				'This collection is moderated': '此合集需审核',
				'This collection is closed': '此合集为关闭状态',
				'This collection is unrevealed': '此合集为未公开状态',
				'This collection is anonymous': '此合集为匿名状态',
				'Show random works on the front page instead of the most recent': '在主页随机显示作品，而不是最新作品',
				'Send a message to the collection email when a work is added': '作品添加时向合集电子邮箱发送通知',
				'Type of challenge, if any': '活动类型（如有）',
				'Gift Exchange': '赠文交换',
				'Prompt Meme': '接梗挑战',
				'Notice to challenge creators': '活动创建者须知',
				'Profile': '概述',
				'Plain text with limited HTML': '纯文本，支持有限 HTML',
				'Introduction': '介绍',
				'FAQ': '常见问题',
				'Rules': '规则',
				'Assignment notification message': '分配通知信息',
				'Gift notification message': '赠文通知信息',
				'Actions': '操作',
			},
			'innerHTML_regexp': [
				['h3.heading + ul.notes li:nth-of-type(1)', /^\s*Only registered users can post, so you don't need to worry about spam: you can leave your collection unmoderated\. You can always reject works afterwards if there <em>is<\/em> a mistaken submission\.\s*$/, '只有注册用户可以发布，因此您无需担心垃圾信息：您可以让您的合集不受审核。如有误提交，您随时可以事后拒绝作品。'],
				['h3.heading + ul.notes li:nth-of-type(2)', /^\s*The best way to set up a regular challenge \(e\.g\., an annual challenge like Yuletide,\s*or a weekly one like sga_flashfic\) is to create a closed parent collection and then add a new, open, subcollection for each challenge\.\s*$/, '设置常规活动（例如年度活动 Yuletide 或每周活动 sga_flashfic ）的最佳方式是创建一个封闭的母合集，然后为每次活动添加一个新的开放的子合集。'],
				['h3.heading + ul.notes li:nth-of-type(3)', /^\s*If you limit membership for each challenge \(e\.g\., for a gift exchange\), people can sign\s*up for each subcollection separately\. If you just want the whole thing moderated, have people sign up as members of the parent collection; they'll then be able to post in every subcollection\.\s*$/, '如果您为每次活动限制成员资格（例如赠文交换），用户可以分别报名加入每个子合集。如果您只想对整个活动进行审核，请让用户报名成为母合集的成员；这样她们就可以在所有子合集中发布内容。'],
				['p.footnote#name-field-notes', /^\s*1 to 255 characters \(A-Z, a-z, _, 0-9 only\), no spaces, cannot begin or end with underscore \(_\)\s*$/, '1 到 255 个字符（仅限 A–Z、a–z、_、0–9），禁止使用空格，且不能以下划线开头或结尾'],
				['p.footnote#title-field-notes', /^\s*\(text only\)\s*$/, '（仅限文本）'],
				['p.footnote#header-image-field-description', /^\s*JPG, GIF, PNG\s*$/, 'JPG、GIF、PNG'],
				['fieldset > legend + p', /^\s*You can also individually\s+Manage Items\s+in your collection\.\s*$/, '您也可以单独管理合集中的作品。'],
				['dd',
					/^\s*<ul class="notes">\s*<li>Each collection can have one icon<\/li>\s*<li>Icons can be in png, jpeg or gif form<\/li>\s*<li>Icons should be sized 100x100 pixels for best results<\/li>\s*<\/ul>\s*$/,
					'<ul class="notes"><li>每个合集可设置一个图标</li><li>图标可为 PNG、JPEG 或 GIF 格式</li><li>建议图标尺寸为 100×100 像素以获得最佳效果</li></ul>'],
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/g, '剩余 $1 字符'],
				['dd',
					/^\s*<ul class="notes">\s*<li>As a challenge owner, you may have access to challenge participants' email addresses\.<\/li>\s*<li>Use of those email addresses for any purpose other than running the challenge will lead to the termination of your account\.<\/li>\s*<\/ul>\s*$/,
					'<ul class="notes"><li>作为活动主办方，您可能可以获得参与者的邮箱地址。</li><li>将这些邮箱用于除活动运营以外的其她任何用途，将导致您的账户被永久停用。</li></ul>'],
				['fieldset.profile > p:first-of-type', /Plain text with limited HTML\s*(<a.*?<\/a>)/, '纯文本，支持有限 HTML $1'],
				['fieldset.profile > p.note', /^\s*Tip: if this is a subcollection or challenge, you don't need to repeat yourself: fields left blank will copy from your parent collection\.\s*$/, '提示：如果这是子合集或活动，您无需重复填写：留空字段将从母合集复制。'],
				['p#assignment-notification-field-description', /^\s*This will be sent out with assignments in a gift exchange challenge\. Plain text only\.\s*$/, '在赠文交换活动中，此信息将随分配一起发送。仅限纯文本。'],
				['p#gift-notification-field-description', /^\s*This will be sent out with each work notification when you "reveal" a gift exchange or prompt meme\. Plain text only\.\s*$/, '当您“揭晓”赠文交换或接梗挑战时，此信息将随每个作品通知发送。仅限纯文本。'],
			],
			'selector': [
				['input[name="commit"][value="Submit"]', '提交'],
			],
		},
		'collections_dashboard_common': {
			'flexible': {
				'Open,': '开放中,',
				'Closed,': '已截止,',
			},
			'static': {
				'Open': '开放中',
				'Sign Up': '报名',
				'Post to Collection': '发布到此合集',
				'Dashboard': '仪表盘',
				'Profile': '概述',
				'Sign-up Form': '报名表',
				'Sign-up Summary': '报名概览',
				'Random Items': '随机作品',
				'People': '用户',
				'Tags': '标签',
				'Any Character': '任意角色',
				'Any Relationship': '任意关系',
				'Any Additional Tag': '任意附加标签',
				'Any Category': '任意类别',
				'Any Rating': '任意分级',
				'Any Archive Warning': '任意 Archive 预警',
				'Description:': '描述：',
				'Optional Tags:': '可选标签：',
				'Submit': '提交',
				'Active since:': '活动开始于：',
				'Maintainers:': '维护者：',
				'Sign-up:': '报名状态：',
				'Sign-up Closes:': '报名截止：',
				'Assignments Due:': '分配截止：',
				'Works Revealed:': '作品揭晓：',
				'Signed up:': '已报名：',
				'The summary is being generated. Please try again in a few minutes.': '概览正在生成，请几分钟后重试。',
				'All Media Types': '所有媒体类型',
				'Show': '显示',
				'No fandoms found': '未找到同人圈',
				'Find gifts for:': '查找赠文',
				'There are no works or bookmarks in this collection yet.': '此合集尚无作品或书签。',
				'These are some of the most popular tags used in the collection.': '以下是此合集中最常用的一些标签。',
				'* Required information': '* 处为必填信息',
				'Rules': '规则',
				'Rules:': '规则:',
				'Prompts:': '同人梗:',
				'Intro': '简介',
				'Intro:': '简介:',
				'FAQ:': '常见问题:',
				'Prompt Form': '同人梗表单',
				'Semi-anonymous Prompt?': '半匿名同人梗？',
				'(Note: This is not totally secure, and is still guessable in some places.)': '（注：此模式并非绝对安全，某些情况下仍可能被推测身份）',
				'choose fandoms from canonical archive tags': '从规范 Archive 标签中选择同人圈',
				'choose characters from canonical archive tags': '从规范 Archive 标签中选择角色',
				'choose relationships from canonical archive tags': '从规范 Archive 标签中选择关系',
				'choose additional tags from canonical archive tags': '从规范 Archive 标签中选择附加标签',
				'(no time specified)': '（未设定具体时间）',
				'Creators Revealed:': '创作者揭晓：',
				'Claim': '认领',
				'Request Fulfilled': '请求已完成',
				'Request Unfulfilled': '请求未完成',
				'Fulfilled By': '完成者',
				'Claimed By': '认领者',
				'> Fandoms': '> 同人圈',
				'Random works': '随机作品',
				'All Challenges': '所有活动',
				'Top-Level Collections': '顶级合集',
				'Sign-ups close at:': '报名截止于：',
				'Requests Summary': '请求概览',
				'Requested Fandoms': '请求的同人圈',
				'Last generated at:': '最后生成于:',
				'(Generated hourly on request while sign-ups are open.)': '（在报名开放期间，可按需每小时生成）',
				'Requests': '请求',
				'Offers': '提供',
				'Fandoms:': '同人圈:',
				'Works:': '作品:',
				'Challenges/Subcollections:': '活动合集/子合集:',
				'Listed by fewest offers and most requests.': '按提供最少、请求最多排序。',
				'Contact:': '联系方式：',
				'(See all...)': '（查看全部...）',
				'(See fewer...)': '（收起...）',
				'Title:': '标题：',
				'Prompt URL:': '同人梗 URL：',
				'Sign-ups close at: (no time specified)': '报名截止于：（未指定时间）',
				'Remove?': '移除此项？',
			},
			'innerHTML_regexp': [
				['h2.heading', /^Sign Up for (.+)$/, '报名 $1'],
				['dd', /^\s*(\d+)\s+Too few sign-ups to display names\s*$/, '$1 人。报名人数过少，无法显示名称'],
				['p.notes.notice', /^Challenge maintainers will have access to the email address associated with your AO3 account for the purpose of communicating with you about the challenge\.$/, '活动维护者将可使用与您 AO3 账户相关联的电子邮箱与您沟通活动相关事宜。'],
				['h3.heading', /^Sign Up as\s*(<span class="byline">.*<\/span>)/, '作为 $1 报名'],
				['dt > label.fandom', /^Fandoms? \(([\d\s-]+)\):(?:\s*\*)*$/, '同人圈（$1）：*'],
				['dt > label.character', /^Characters? \(([\d\s-]+)\):(?:\s*\*)*$/, '角色（$1）：*'],
				['dt > label.relationship', /^Relationships? \(([\d\s-]+)\):(?:\s*\*)*$/, '关系（$1）：*'],
				['dt > label.freeform', /^Additional Tags \(([\d\s-]+)\):(?:\s*\*)*$/, '附加标签（$1）：*'],
				['dt > label.category', /^Categories \(([\d\s-]+)\):(?:\s*\*)*$/, '类别（$1）：*'],
				['dt > label.rating', /^Ratings \(([\d\s-]+)\):(?:\s*\*)*$/, '分级（$1）：*'],
				['dt > label.warning', /^Archive Warnings \(([\d\s-]+)\):(?:\s*\*)*$/, 'Archive 预警（$1）：*'],
				['h4.heading', /^Archive Warnings$/, 'Archive 预警'],
				['div.flash.notice', /^Summary does not appear until at least 5 sign-ups have been made!$/, '至少 5 人报名后才会显示概览！'],
				['h2.heading', /^Sign-up Summary for (.+)/, '$1 报名概览'],
				['h2.heading', /^(<a href="\/collections\/.*?">.+<\/a>) > Fandoms$/, '$1 > 同人圈'],
				['h2.heading', /^(\d+)\s+Works? in (<a href="\/collections\/.*?">.+<\/a>)/, '$2 中的作品：$1'],
				['h2.heading', /^\s*(\d+)\s+(?:Bookmarked Items|已创建书签作品) in\s+(<a href="\/collections\/.*?">.+?<\/a>)\s*$/s, '$2 的已创建书签作品：$1'],
				['h2.heading', /^Participants in (.+)/, '$1 的参与者'],
				['h5.heading', /(\d+)\s*works?,\s*(\d+)\s*recs?/, '$1 篇作品，$2 条推荐'],
				['h3.heading', /(\d+\s*-\s*\d+)\s+of\s+([\d,]+)\s+Collections/s, '第 $1 个，共 $2 个合集'],
				['li a, li span.current', /^Prompts\s*\((\d+)\)$/, '同人梗 ($1)'],
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
				['h2.heading', /^\s*Challenges\/Subcollections in\s*(.+?)\s*$/s, '$1 中的挑战/子合集'],
				['h2.heading', /^\s*Prompts for\s+(.+?)\s*$/, '$1 的同人梗'],
				['h3.heading', /^\s*Requests?(.*)\s*$/, '请求$1'],
				['h3.heading', /^\s*Offers?(.*)\s*$/, '提供$1'],
				['ul.commas.index.group', /^\s*(\d+)\s+anonymous\s+claimant(s?)\s*$/, '$1 位匿名认领者'],
				['h4.heading', /^\s*Request\s+by\s+(?:Anonymous|匿名)\s*$/s, '请求 by 匿名'],
				['p.actions a.showme', /^\s*Add another request\?\s*\(Up to (\d+) allowed\.\)\s*$/, '添加另一个请求项？（最多可添加 $1 个）'],
				['p.actions a.showme', /^\s*Add another offer\?\s*\(Up to (\d+) allowed\.\)\s*$/, '添加另一个提供项？（最多可添加 $1 个）'],
				['h2.heading', /^\s*(\d+)\s+Works? in\s*(<a href="\/collections\/.*?">.+?<\/a>)\s*$/s, '$2 中的 $1 篇作品'],
				['h2.heading', /^\s*Participants in\s+(.+?)\s*$/s, '$1 的参与者'],
				['h4.heading', /^\s*Request\s+by\s+(.+?)\s*$/s, '请求 by $1'],
			],
			'regexp': [
				[/^Subcollections \((\d+)\)$/, '子合集（$1）'],
				[/^Fandoms \((\d+)\)$/, '同人圈（$1）'],
				[/^Works \((\d+)\)$/, '作品（$1）'],
				[/^Bookmarked Items \((\d+)\)$/, '已创建书签作品（$1）'],
			],
			'selector': []
		},
		'external_works_new': {
			'static': {
				'Bookmark an external work': '为外部作品创建书签',
				'Bookmark': '书签',
				'External Work': '外部作品',
				'Creator\'s Tags': '创建者标签',
				'Write Comments': '撰写评论',
				'Choose Type and Post': '选择类型并发布',
				'URL*': 'URL *',
				'Creator*': '作者 *',
				'Title*': '标题 *',
				'Creator\'s Summary': '作者简介',
				'(please copy and paste from original work)': '(请从原作复制并粘贴)',
				'Fandoms*': '同人圈 *',
				'Rating': '分级',
				'Categories': '分类',
				'Relationships': '关系',
				'Characters': '角色',
				'Your tags': '标签',
				'Add to collections': '添加到合集',
				'Private bookmark': '私人书签',
				'Rec': '推荐',
				'* Required information': '* 处为必填信息',
				'If this URL has been bookmarked before, the work information will be filled in automatically.': '如果此 URL 之前已被创建书签，作品信息将自动填充。',
				'Creator\'s Tags (comma separated, 150 characters per tag). Only a fandom is required. Fandom, relationship, and character tags must not add up to more than 75. Category and rating tags do not count toward this limit.': '创建者标签（逗号分隔，每个标签最多 150 字符）。仅需填写同人圈标签。同人圈、关系和角色标签总字符数不得超过 75 字符。分类和分级标签不计入此限制。',
				'Plain text with limited HTML': '纯文本，支持有限 HTML',
				'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
				'Create': '创建',
				'My Bookmarks': '我的书签',
			},
			'innerHTML_regexp': [
				[
					'div.post.bookmark > p:first-of-type',
					/Bookmark external works with the <a href="([^"]*)"[^>]*>AO3 External Bookmarklet<\/a>\. This is a simple bookmarklet that should work in any browser, if you have JavaScript enabled\. Just right-click and select <cite>Bookmark This Link<\/cite> \(or <cite>Bookmark Link<\/cite>\)\./s,
					'使用 <a href="$1" title="右键单击并为此链接添加书签">AO3 外部书签工具</a>对外部作品创建书签。这个简单的书签工具只要启用 JavaScript 即可在任何浏览器中使用。只需右键单击并选择 <cite>将此链接加入书签</cite>（或 <cite>书签链接</cite> ）。'
				],
				[
					'p.character_counter',
					/(<span[^>]*>\d+<\/span>)\s*characters left/s,
					'剩余 $1 字符'
				],
				[
					'#modal .content p:has(a[href*="content#II.J"])',
					/\(For more information, see the <a href="\/content#II.J">Ratings and Warnings section of the AO3 Terms of Service<\/a>\.\)/s,
					'（要了解更多信息，请参阅 <a href="/content#II.J">AO3 服务条款的分级与预警部分</a>。）'
				],
			],
			'regexp': [],
			'selector': []
		},

		'media_index': {
			'static': {},
			'regexp': [],
			'selector': [
				['.media.fandom.index.group p.actions a', '全部']
			]
		},

		'users_inbox': {
			'static': {
				'My Inbox': '收件箱'
			},
			'regexp': [
				[/^My Inbox \((\d+) comment(?:s)?, (\d+) unread\)$/, '收件箱：$1 条评论, $2 条未读']
			],
			'selector': []
		},

		'session_login': {
			'static': {
				'Log In': '用户登录',
				'User name or email': '用户名或邮箱',
				'Password': '密码',
				'Remember Me': '记住我',
				'Forgot password?': '忘记密码?',
				'It seems you\'re using an ad blocker.': '您似乎使用了广告拦截器。',
			},
			'regexp': [],
			'selector': []
		},
		'session_logout': {
			'static': {
				'You have been logged out.': '您已成功登出。',
				'Log back in?': '重新登录？'
			},
			'regexp': [],
			'selector': []
		},
		'admin_posts_show': {
			'static': {
				'AO3 News': 'AO3 最新动态',
				'Previous Post': '上一篇',
				'Next Post': '下一篇',
				'Published:': '发布于：',
				'Original:': '原文：',
				'Tags:': '标签：',
				'Translations:': '翻译版本：',
				'↑ Top': '↑ 返回顶部',
				'Back to AO3 News Index': '返回 AO3 动态总览',
				'Reply': '回复',
				'Thread': '评论串',
				'Parent Thread': '主评论串',
				'Block': '屏蔽',
				'RSS Feed': 'RSS 订阅',
				'Edit': '编辑',
				'Comment': '评论',
				'Comment on': '评论于：',
				'Last Edited': '最后编辑',
				'(Plain text with limited HTML': '(纯文本，支持有限 HTML',
				'Sorry, this news post doesn\'t allow comments.': '抱歉，此动态帖不允许评论。',
				'Sorry, comments are disabled for this post.': '抱歉，此动态贴不允许评论。',
				'Comments on this news post are moderated. Your comment will not appear until it has been approved.': '此动态帖的评论需审核。您的评论在获得批准前不会显示。',
				'Brevity is the soul of wit, but we need your comment to have text in it.': '简洁乃智慧之魂，但您的评论必须包含文字内容。',
			},
			'innerHTML_regexp': [
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/, '剩余 $1 字符'],
				[
					'ul.actions a',
					/^Read (\d+) Comments$/,
					'阅读 $1 条评论'
				],
				[
					'p.notice',
					/^\s*Sorry, this news post doesn't allow non-Archive users to comment\.\s*You can however <a href="\/support">contact Support<\/a> with any feedback or questions\.\s*$/s,
					'抱歉，此动态贴不允许非 Archive 用户发表评论。您可通过<a href="/support">联系支持团队</a>提供反馈或咨询。'
				],
			],
			'regexp': [
				[/^Comments \((\d+)\)$/, '评论（$1）'],
				[/^Hide Comments \((\d+)\)$/, '收起评论（$1）'],
				[/^View all (\d+) comments$/, '查看全部 $1 条评论']
			],
			'selector': [
				[['input[name="commit"][value="Comment"]', '评论']]
			]
		},
		'admin_posts_index': {
			'static': {},
			'innerHTML_regexp': [],
			'regexp': [],
			'selector': []
		},
		'works_chapters_show': {
			'static': {
				'Chapter by Chapter': '逐章阅读',
				'Mark for Later': '稍后阅读',
				'Mark as Read': '标记已读',
				'Cancel Bookmark': '取消创建书签',
				'Share': '分享',
				'↑ Top': '↑ 回到顶部',
				'Kudos': '点赞',
				'Reply': '回复',
				'Thread': '评论串',
				'Parent Thread': '主评论串',
				'←Previous Chapter': '← 上一章',
				'← Previous Chapter': '← 上一章',
				'Next Chapter →': '下一章 →',
				'Next Chapter→': '下一章 →',
				'← Previous Work': '← 上一作品',
				'Next Work →': '下一作品 →',
				'Download': '下载',
				'Comment': '评论',
				'Hide Comments': '隐藏评论',
				'(Plain text with limited HTML': '(纯文本，支持有限 HTML',
				'Brevity is the soul of wit, but we need your comment to have text in it.': '简洁乃智慧之魂，但您的评论需要包含文字内容。',
				'Thank you for leaving kudos!': '感谢您的点赞！',
				'You have already left kudos here. :)': '您已经点赞过了 :)',
				'Your tags': '标签',
				'The creator\'s tags are added automatically.': '创作者的标签会自动添加',
				'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
				'Add to collections': '添加到合集',
				'Private bookmark': '私人书签',
				'Create': '创建',
				'Series this work belongs to:': '所属系列：',
				'Works inspired by this one:': '衍生作品：',
			},
			'innerHTML_regexp': [
				[
					'div.flash.notice',
					/^\s*This work was removed from your <a href="([^"]*)">Marked for Later list<\/a>\.\s*$/s,
					'已将此作品移出<a href="$1">稍后阅读列表</a>。'
				],
				['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/, '剩余 $1 字符'],
				['h3.title', /<a (.*?)>Chapter (\d+)<\/a>:\s*(.*)/s, '<a $1>第 $2 章</a>: $3'],
				['h3.title', /<a (.*?)>Chapter (\d+)<\/a>/s, '<a $1>第 $2 章</a>'],
				['p.jump', /\(See the end of the work for (<a.*?>)(more )?notes(<\/a>)\.\)/, (_match, p1, p2, p3) => `（在作品结尾查看${p1}${p2 ? '更多' : ''}注释${p3}。）`],
				['div.chapter div.notes > p', /\(See the end of the chapter for\s*(<a.*?>)(more )?notes(<\/a>)\.\)/, (_match, p1, p2, p3) => `（在本章结尾查看${p1}${p2 ? '更多' : ''}注释${p3}。）`],
				['p.jump', /\(See the end of the work for (<a href="[^"]*#children">)other works inspired by this one(<\/a>)\.\)/, '（在作品结尾查看$1相关衍生作品$2。）'],
				[
					'div.series span.position, dd.series span.position',
					/^\s*Part (\d+) of (<a href="\/series\/.*?">.*?<\/a>)(.*)$/si,
					'$2 第 $1 部分$3'
				],
				[
					'p.notice',
					/^\s*This work's creator has chosen to moderate comments on the work\.\s*Your comment will not appear until it has been approved by the creator\.\s*$/s,
					'此作品的创作者已选择审核评论。您的评论将在创作者批准后显示。'
				],
				[
					'p#notes-field-description',
					/^\s*The creator's summary is added automatically\.\s*Plain text with limited HTML\s*(<a[^>]+>[\s\S]*?<\/a>)\s*$/s,
					'创作者的简介会自动添加。纯文本，支持有限 HTML $1'
				]
			],
			'regexp': [
				[/^Comments \((\d+)\)$/, '评论（$1）'],
				[/^Hide Comments \((\d+)\)$/, '隐藏评论（$1）']
			],
			'selector': []
		},
		'faq_page': {
			'static': {
				'Expand Categories': '展开分类',
				'Collapse Categories': '折叠分类'
			},
			'innerHTML_regexp': [
				['h2.heading', /^\s*Archive FAQ\s*$/, 'Archive 常见问题'],
				[
					'p.notice',
					/^\s*The FAQs are currently being updated and translated by our volunteers\.\s*This is a work in progress and not all information will be up to date or available in languages other than English at this time\.\s*If your language doesn't list all FAQs yet, please consult the English list and check back later for updates\.\s*$/s,
					'常见问题目前正在由我们的志愿者更新和翻译。此工作仍在进行中，目前并非所有信息都已更新或提供非英文版本。如果您的语言尚未列出所有常见问题，请查阅英文列表，并稍后回来查看更新。'
				],
				[
					'p.notes',
					/^\s*Some commonly asked questions about the Archive are answered here\.\s*Questions and answers about our Terms of Service can be found in the <a href="\/tos_faq\?language_id=[\w-]+">(?:TOS FAQ|服务条款常见问题)<\/a>\.\s*You may also like to check out our <a href="\/known_issues\?language_id=[\w-]+">(?:Known Issues|已知问题)<\/a>\.\s*If you need more help, please\s*<a href="\/support\?language_id=[\w-]+">(?:contact Support|联系支持团队)<\/a>[\.。]\s*$/s,
					'此处解答了一些关于 Archive 的常见问题。有关我们服务条款的问题和答案，请查阅<a href="/tos_faq?language_id=en">服务条款常见问题</a>。您也可以查看我们的<a href="/known_issues?language_id=en">已知问题</a>。如果需要更多帮助，请<a href="/support?language_id=en">联系支持团队</a>。'
				],
				[
					'h3.heading',
					/^\s*Available Categories\s*(<ul class="showme hidden actions"[\s\S]*?<\/ul>)\s*$/s,
					'可用分类 $1'
				],
			],
			'regexp': [],
			'selector': []
		},
		'site_map': {
			'static': {
				'Explore': '探索',
				'Homepage': '主页',
				'Additional Tags Cloud': '附加标签集',
				'Languages': '语言',
				'Collections and Challenges': '合集与挑战',
				'About the Archive of Our Own': '关于 Archive of Our Own',
				'Terms of Service FAQ': '服务条款常见问题',
				'Archive FAQ': 'Archive 常见问题',
				'AO3 News': 'AO3 最新动态',
				'Access your account': '访问您的帐户',
				'My Home': '我的主页',
				'My Collections and Challenges': '我的合集与挑战',
				'My Inbox': '我的收件箱',
				'Change your account settings': '更改您的账户设置',
				'My Profile': '个人资料',
				'Donations': '捐赠',
			},
			'innerHTML_regexp': [
				['li', /^\s*The Archive of Our Own is a project of the <a href="https:\/\/transformativeworks\.org"><acronym title="[^"]+">OTW<\/acronym><\/a>\s*$/s, 'Archive of Our Own 是再创作组织（OTW）旗下项目'],
			],
			'regexp': [],
			'selector': []
		},
		'report_and_support_page': {
			'static': {
				'Your name or username (optional)': '您的姓名或用户名（可选）',
				'Your name (optional)': '您的姓名（可选）',
				'Your email (required)': '您的电子邮箱（必填）',
				'We cannot contact you if the email address you provide is invalid.': '如果您提供的电子邮箱地址无效，我们将无法与您联系。',
				'Select language (required)': '选择语言（必填）',
				'Link to the page you are reporting (required)': '您要举报的页面链接（必填）',
				'Please enter the link to the page you are reporting.': '请输入您要举报的页面链接。',
				'Please ensure this link leads to the page you intend to report. Enter only one URL here and include any other links in the description field below.': '请确保该链接确实指向您希望举报的页面。此处仅填写一个网址，其她链接请填写在下方描述栏中。',
				'Brief summary of Terms of Service violation (required)': '违反服务条款简述（必填）',
				'Please enter a subject line for your report.': '请输入举报主题',
				'Please specify why you are contacting us and/or what part of the Terms of Service is relevant to your complaint. (For example, "harassment", "not a fanwork", "commercial activities", etc.)': '请说明您联系我们的原因及/或涉及服务条款的相关内容。（例如：“骚扰行为”、“非同人作品”、“商业活动”等）',
				'Description of the content you are reporting (required)': '举报内容描述（必填）',
				'Please describe what you are reporting and why you are reporting it.': '请描述您要举报的内容及举报原因',
				'Brief summary of your question or problem (required)': '问题简述（必填）',
				'Please enter a brief summary of your message': '请输入您信息的简要说明',
				'Your question or problem (required)': '您的问题或疑问（必填）',
				'Please be as specific as possible, including error messages and/or links': '请尽可能具体，包括错误信息和/或相关链接',
				'Please enter your feedback': '请输入您的反馈',
				'Send': '发送',
				'Submit': '提交',
			},
			'innerHTML_regexp': [
				['p#comment-field-description', /Explain how the content you are reporting violates the <a href="\/content">(?:Content Policy|内容政策)<\/a> or other parts of the <a href="\/tos">(?:Terms of Service|服务条款)<\/a>\. Please be as specific as possible and <a href="\/abuse_reports\/new#reporthow">include all relevant links and other information in your report<\/a>\. All information provided will remain confidential\./s, '说明您所举报的内容如何违反了<a href="/content">内容政策</a>或<a href="/tos">服务条款</a>的其她部分。请尽可能具体，并在<a href="/abuse_reports/new#reporthow">反馈中包含所有相关链接及信息</a>。您提供的所有信息都将保密。'],
				[
					'h3.heading',
					/^\s*Please use this form for questions about how to use the Archive and for reporting any technical problems\.\s*$/s,
					'请使用此表单咨询有关如何使用 Archive 的问题，或报告任何技术问题。'
				]
			]
		},
	}
};