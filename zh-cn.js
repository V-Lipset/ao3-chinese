/**
 name         AO3 Translator - zh-cn
 namespace    https://github.com/V-Lipset/ao3-chinese
 version      1.10.0-2026-09-20
 description  AO3 Translator 的词库文件
 author       V-Lipset
 license      GPL-3.0
 supportURL   https://github.com/V-Lipset/ao3-chinese/issues
*/

/**************************************************************************
 * I18N 翻译数据区
 **************************************************************************/

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

const I18N = {
	'conf': {
		ignoreMutationSelectorPage: {
			'*': ['.userstuff .revised.at', '.kudos_count', '.bookmark_count', '.comment_count', '.hit_count', '.view_count'],
			'works_show': ['.stats .hits', '.stats .kudos'],
		},
		ignoreSelectorPage: {
			'*': [
				// HTML 基础与代码/媒体标签
				'script', 'style', 'noscript', 'iframe', 'canvas', 'video', 'audio', 'img', 'svg', 'pre', 'code', 'textarea',

				// 插件生成的 UI 元素
				'[data-translated-by-custom-function]',
				'.translate-me-ao3-wrapper',
				'.ao3-translated-content',
				'.ao3-translated-title',
				'.translated-tags-container',
				'div.autocomplete.dropdown ul',
				'.ao3-tag-translation',
				'.ao3-tag-original',
				'.translated-by-ao3-translator-error',

				// 用户生成的长文本
				'#chapters .userstuff',
				'.summary blockquote.userstuff',
				'blockquote.userstuff.summary',
				'.notes blockquote.userstuff',
				'blockquote.userstuff.notes',
				'.comment blockquote.userstuff',
				'.bio .userstuff',
				'.workskin',

				// 用户生成的短文本
				'a[rel="author"]',
				'h4.heading a[href^="/works/"]',
				'h4.heading a[href^="/series/"]',
				'h2.title a[href^="/works/"]',
				'h2.title a[href^="/series/"]',
				'ul.series a[href^="/series/"]',
				'dd.series a[href^="/series/"]',
				'h5.fandoms a.tag',
				'.fandom a.tag',
				'li.freeforms',
				'dd.freeform.tags',
				'dd.language'
			],

			'works_show': ['.dropdown.actions-menu ul', '#main .userstuff'],
			'works_chapters_show': ['#main .userstuff'],
			'series_show': ['h2.heading'],
			'admin_posts_show': ['.userstuff'],
			'tag_sets_index': ['h2.heading', 'dl.stats'],
			'tag_sets_new': ['h4.heading > label[for*="freeform"]'],
			'collections_dashboard_common': ['.primary.header.module blockquote.userstuff'],
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
				'Bookmarker\'s Tags:': '创建者的标签：', 'Bookmarker\'s Collections:': '创建者的合集：', 'Completed': '已完结',
				'Bookmark Tags:': '书签标签：', 'Complete Work': '已完结', 'Work in Progress': '连载中', 'Public Bookmark': '公开书签',
				'Most Popular': '最常用', 'Tag Sets': '标签集',
				'Warnings': '预警',
				'Find your favorites': '寻找喜欢的内容',
				'Random Items': '随机作品',
				'Random bookmarks': '随机书签',

				// 登录
				'Log In': '登录',
				'Log in': '登录',
				'Sign Up': '注册',
				'User': '用户',
				'Username or email:': '用户名/邮箱:',
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
				'Last Edited': '最后编辑于',
				'Parent': '上级评论',

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
				'Clear Entire History': '清空历史记录',
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
				'Collection tags:': '合集标签:',
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
				'Word count': '字数统计',
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
				'Challenges/Subcollections:': '活动合集/子合集:',
				'Bookmarked Items': '书签作品',
				'Bookmarked Items:': '书签作品:',

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

				// 创建账户
				'Create Account': '创建账户',
				'User Details': '用户详情',
				'Username': '用户名',
				'Confirm password': '确认密码',
				'Valid email': '有效电子邮箱',
				'8 to 72 characters': '8 到 72 个字符',
				'You need a username! (At least 3 letters long, please.)': '您需要一个用户名！（请至少包含 3 个字符。）',
				'Must be less than 40 letters long.': '长度必须少于 40 个字符。',
				'Must be at least 3 letters long.': '长度必须至少为 3 个字符。',
				'Please enter a password! (At least 8 characters long, please.)': '请输入密码！（请至少包含 8 个字符。）',
				'Must be at least 8 letters long.': '长度必须至少为 8 个字符。',
				'Must be less than 72 letters long.': '长度必须少于 72 个字符。',
				'Please enter the same password in both fields.': '请在两个字段中输入相同的密码。',

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
				'Brevity is the soul of wit, but we need your comment to have text in it.': '简洁乃智慧之魂，但您的评论必须包含文字内容。',
				'Brevity is the soul of wit, but your content does have to be at least 10 characters long.': '简洁乃智慧之魂，但您的内容长度必须至少 10 个字符。',
				'must be less than 10000 characters long.': '长度不得超过 10000 个字符。',
				'If the email address you entered is currently associated with an AO3 account, you should receive an email with instructions to reset your password.': '如果您输入的电子邮件地址当前关联了一个 AO3 账户，您将会收到一封包含密码重置说明的邮件。',
        		"Sorry! We couldn't save this user because:": "抱歉！我们无法保存此用户，因为：",
				"Username has already been taken": "用户名已被占用",
				'Almost Done!': '即将完成！',
				'Return to Archive front page': '返回 Archive 首页',
				'This invitation has already been used to create an account, sorry!': '抱歉，此邀请码已被用于创建账户！',
				'Your account has already been activated.': '您的账户已经激活。',

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
				['li a, li span.current', /^\s*Subcollections\s*\((\d+)\)\s*$/s, '子合集（$1）'],
				['li a, li span.current', /^\s*Fandoms\s*\((\d+)\)\s*$/s, '同人圈（$1）'],
				['li a, li span.current', /^\s*Bookmarked Items\s*\((\d+)\)\s*$/s, '书签作品（$1）'],
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
				['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+(?:Bookmarked Items|书签作品) in\s+(<a[^>]+>.+?<\/a>)\s*$/s, '$4：$3 篇书签作品，第 $1 - $2 篇'],
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
				[
					'h2.heading, h4.heading',
					/^\s*Request\s+by\s+(.+?)\s*$/s,
					(_match, author) => {
						const authorText = author.trim();
						if (authorText === 'Anonymous' || authorText === '匿名') {
							return '匿名用户的请求';
						}
						else {
							return `${authorText} 的请求`;
						}
					}
				],
				[
					'p.note',
					/You need to be at least 13 years old to become a registered member of the Archive\. \(Sorry to anyone younger! You'll be more than welcome when the time comes\.\)/s,
					'您需要年满 13 周岁才能成为本站的注册会员。（对年龄较小的朋友们深表歉意！等您达到年龄要求时，我们非常欢迎您的加入。）'
				],
				[
					'label[for="user_registration_age_over_13"]',
					/Yes, I am at least 13\./s,
					'是的，我已年满 13 周岁。'
				],
				[
					'p', 
					/^\s*Before you begin using AO3, you must agree to our <a[^>]+>Terms of Service \(opens in new window\)<\/a>, including the <a[^>]+>Content Policy \(opens in new window\)<\/a> and <a[^>]+>Privacy Policy \(opens in new window\)<\/a>\s*[.。]\s*$/s,
					'在开始使用 AO3 之前，您必须同意我们的<a target="_blank" rel="noopener" href="/tos">服务条款（在新窗口打开）</a>，包括<a target="_blank" rel="noopener" href="/content">内容政策（在新窗口打开）</a>和<a target="_blank" rel="noopener" href="/privacy">隐私政策（在新窗口打开）</a>。'
				],
				[
					'label[for="user_registration_terms_of_service"]',
					/Yes, I have read the Terms of Service, including the Content Policy and Privacy Policy, and agree to them\./s,
					'是的，我已阅读并同意服务条款，包括内容政策和隐私政策。'
				],
				[
					'label[for="user_registration_data_processing"]',
					/By checking this box, you consent to the processing of your personal data in the United States and other jurisdictions in connection with our provision of AO3 and its related services to you\. You acknowledge that the data privacy laws of such jurisdictions may differ from those provided in your jurisdiction\. For more information about how your personal data will be processed, please refer to our Privacy Policy\./s,
					'勾选此框即表示您同意在美国及其她司法管辖区为向您提供 AO3 及其相关服务而处理您的个人数据。您确认该司法管辖区的数据隐私法律可能与您所在司法管辖区存在差异。有关您的个人数据将如何被处理的更多信息，请参阅我们的隐私政策。'
				],
				[
					'div.userstuff p',
					/You should soon receive an activation email.*?will come from <strong>(.*?)<\/strong> -- you might want to add this to your address book to make sure you get the email\./s,
					'您很快就会在提供的邮箱地址收到一封激活邮件。邮件中包含激活账户并完成创建流程所需的链接。激活邮件将由 <strong>$1</strong> 发送 —— 您可以将其添加到通讯录中，以确保能收到邮件。'
				],
				[
					'div.userstuff p',
					/If you haven't received this email within 24 hours.*?please <a href="\/support">contact Support<\/a> for help\./s,
					'如果您在 24 小时内未收到邮件，且在垃圾邮件过滤器或社交文件夹中也未找到，请 <a href="/support">联系支持团队</a> 以寻求帮助。'
				],
				[
					'div.userstuff p',
					/<strong>Important!<\/strong>\s*You must activate your account within 14 days, or your account will expire\. If this happens, you can sign up again using the same invitation\./s,
					'<strong>重要提示！</strong> 您必须在 14 天内激活账户，否则账户将过期。如果发生这种情况，您可以使用同一份邀请再次注册。'
				],

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
				['h2.heading', /^About (.*)$/, '关于 $1'],
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
				['h2.heading', /^(\d+)\s+Works? in (<a href="\/collections\/.*?">.+<\/a>)/, '$2：$1 篇作品'],
				['h2.heading', /^\s*(\d+)\s+(?:Bookmarked Items|书签作品) in\s+(<a href="\/collections\/.*?">.+?<\/a>)\s*$/s, '$2：$1 篇书签作品'],
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
				['h2.heading', /^\s*(\d+)\s+Works? in\s*(<a href="\/collections\/.*?">.+?<\/a>)\s*$/s, '$2：$1 篇作品'],
				['h2.heading', /^\s*Participants in\s+(.+?)\s*$/s, '$1 的参与者'],
				['h4.heading', /^\s*Request\s+by\s+(.+?)\s*$/s, '请求 by $1'],
			],
			'regexp': [],
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
				'(Plain text with limited HTML': '(纯文本，支持有限 HTML',
				'Sorry, this news post doesn\'t allow comments.': '抱歉，此动态帖不允许评论。',
				'Sorry, comments are disabled for this post.': '抱歉，此动态贴不允许评论。',
				'Comments on this news post are moderated. Your comment will not appear until it has been approved.': '此动态帖的评论需审核。您的评论在获得批准前不会显示。',
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
					'li',
					/^\s*In response to a\s+(<a[^>]+>)prompt(<\/a>)\s+by\s+(.+?)\s+in the\s+(<a[^>]+>.+?<\/a>)\s+collection\.\s*$/s,
					(_match, p1, p2, author, collection) => {
						const authorText = author.trim();
						if (authorText === 'Anonymous' || authorText === '匿名') {
							return `响应了 ${collection} 合集中由匿名用户提出的${p1}同人梗${p2}。`;
						}
						else {
							return `响应了 ${collection} 合集中由 ${authorText} 提出的${p1}同人梗${p2}。`;
						}
					}
				],
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
				'Collapse Categories': '折叠分类',
				'Available Categories': '可用分类'
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
				]
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
