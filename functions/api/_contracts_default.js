// Default rental contract templates (3 languages)
// Placeholders use {{key}} format. Available keys are documented in admin UI.

export const DEFAULT_CONTRACT_EN = `<h1>Tenancy Agreement</h1>
<p style="text-align:right; color:#666; font-size:14px;">Contract No: {{bookingId}}<br>Date: {{contractDate}}</p>

<h2>Parties</h2>
<p><strong>Landlord:</strong> {{landlordName}}<br>
Address: {{landlordAddress}}<br>
Representative: {{landlordRep}}</p>

<p><strong>Tenant:</strong> {{name}} {{nameChinese}}<br>
{{idType}} No.: {{idNumber}}<br>
Nationality: {{nationality}}<br>
Date of birth: {{dateOfBirth}}<br>
Current address: {{currentAddress}}<br>
Phone: {{phone}}<br>
Email: {{email}}</p>

<h2>1. Premises</h2>
<p>The Landlord agrees to let to the Tenant the room described below at Demain Life @ 1331, Kowloon, Hong Kong:</p>
<ul>
  <li><strong>Room type:</strong> {{roomType}}</li>
  <li><strong>Occupancy:</strong> {{occupancy}} person(s)</li>
</ul>

<h2>2. Term</h2>
<p>The tenancy shall be for a fixed term of <strong>{{duration}}</strong>, commencing on <strong>{{moveInDate}}</strong> and ending on <strong>{{moveOutDate}}</strong> (both dates inclusive).</p>

<h2>3. Rent</h2>
<p>The monthly rent is <strong>HK$ {{roomPrice}}</strong>, payable in advance on or before the first day of each calendar month. Rent includes water, electricity (within fair-use cap), Wi-Fi and basic furniture; usage in excess of the fair-use cap will be billed separately.</p>

<h2>4. Security Deposit</h2>
<p>The Tenant shall pay a refundable security deposit equivalent to <strong>two (2) months' rent (HK$ {{depositAmount}})</strong> upon signing this agreement. The deposit will be returned within 30 days after the end of the tenancy, less any deductions for unpaid rent, damage beyond fair wear and tear, or unsettled utility charges.</p>

<h2>5. Payment</h2>
<p>The amount payable upon signing this agreement is determined by the Landlord and communicated to the Tenant separately. Acceptable payment methods include FPS (Faster Payment System), bank transfer to the account designated by the Landlord, or other methods approved by the Landlord.</p>

<h2>6. Use of Premises</h2>
<p>The Tenant shall use the premises for residential purposes only. The Tenant shall not sublet, share, or assign the premises without the Landlord's prior written consent.</p>

<h2>7. House Rules</h2>
<p>The Tenant agrees to abide by the Demain Life house rules including, without limitation: (a) no smoking inside the premises; (b) no pets without prior consent; (c) quiet hours between 11pm and 7am; (d) no commercial activity inside the room; (e) compliance with all applicable Hong Kong laws.</p>

<h2>8. Maintenance and Repairs</h2>
<p>The Landlord is responsible for major structural repairs and the maintenance of building services. The Tenant is responsible for minor repairs and for any damage caused by the Tenant or the Tenant's guests.</p>

<h2>9. Termination</h2>
<p>Either party may terminate this agreement before the expiry of the term by giving not less than one (1) month's written notice, provided that early termination by the Tenant within the first six (6) months of tenancy will result in forfeiture of the security deposit, unless otherwise agreed in writing.</p>

<h2>10. Personal Information</h2>
<p>The Tenant acknowledges that the Landlord collects and processes personal data (including identity documents and emergency contact details) solely for the purposes of this tenancy, in accordance with the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong.</p>

<h2>11. Governing Law</h2>
<p>This agreement shall be governed by and construed in accordance with the laws of the Hong Kong Special Administrative Region.</p>

<h2>12. Emergency Contact</h2>
<p>In the event of emergency, please contact:</p>
<p>Name: {{emergencyName}} ({{emergencyRelation}})<br>
Phone: {{emergencyPhone}}<br>
Email: {{emergencyEmail}}</p>

<h2>Signatures</h2>
<p>By signing below, both parties confirm they have read, understood, and agreed to all the terms above.</p>

<table style="width:100%; margin-top:30px;"><tr>
<td style="width:50%; vertical-align:top; padding-right:20px;">
  <p><strong>Landlord</strong></p>
  <p style="height:60px; border-bottom:1px solid #333;">&nbsp;</p>
  <p>{{landlordName}}<br>By: {{landlordRep}}<br>Date: {{contractDate}}</p>
</td>
<td style="width:50%; vertical-align:top; padding-left:20px;">
  <p><strong>Tenant</strong></p>
  <p style="height:60px; border-bottom:1px solid #333;">{{signaturePlaceholder}}</p>
  <p>{{name}}<br>{{idType}} No.: {{idNumber}}<br>Date: {{signatureDate}}</p>
</td>
</tr></table>`

export const DEFAULT_CONTRACT_ZH_HK = `<h1>租賃協議</h1>
<p style="text-align:right; color:#666; font-size:14px;">合約編號：{{bookingId}}<br>日期：{{contractDate}}</p>

<h2>簽約雙方</h2>
<p><strong>業主：</strong>{{landlordName}}<br>
地址：{{landlordAddress}}<br>
代表人：{{landlordRep}}</p>

<p><strong>租客：</strong>{{name}} {{nameChinese}}<br>
{{idType}} 號碼：{{idNumber}}<br>
國籍：{{nationality}}<br>
出生日期：{{dateOfBirth}}<br>
現居地址：{{currentAddress}}<br>
電話：{{phone}}<br>
電郵：{{email}}</p>

<h2>一、租賃物</h2>
<p>業主同意將位於香港九龍 Demain Life @ 1331 內以下房間出租予租客：</p>
<ul>
  <li><strong>房型：</strong>{{roomType}}</li>
  <li><strong>入住人數：</strong>{{occupancy}} 位</li>
</ul>

<h2>二、租期</h2>
<p>本租賃為定期租約，租期 <strong>{{duration}}</strong>，由 <strong>{{moveInDate}}</strong> 起至 <strong>{{moveOutDate}}</strong> 止（首尾兩日包括在內）。</p>

<h2>三、租金</h2>
<p>月租金為 <strong>港幣 {{roomPrice}} 元</strong>，須於每月第一天或之前繳付。租金已包括水費、電費（在合理使用上限內）、Wi-Fi 及基本家具；超出合理使用上限之部分將另行計算。</p>

<h2>四、按金</h2>
<p>租客須於簽署本協議時繳付相當於 <strong>兩 (2) 個月租金（港幣 {{depositAmount}} 元）</strong>之可退還按金。按金將於租期屆滿後 30 天內退還，惟須扣除任何未付租金、超過合理損耗範圍之損壞，或未結算之雜費。</p>

<h2>五、付款</h2>
<p>簽署本協議時應付之款項由業主另行通知租客。接受之付款方式包括轉數快（FPS）、轉賬至業主指定銀行戶口，或業主同意之其他方式。</p>

<h2>六、使用</h2>
<p>租客只可將租賃物用作住宅用途，未經業主書面同意，不得將租賃物轉租、分租或轉讓予他人。</p>

<h2>七、住戶守則</h2>
<p>租客同意遵守 Demain Life 住戶守則，包括（但不限於）：(a) 室內禁止吸煙；(b) 未經同意不得飼養寵物；(c) 安靜時段為晚上 11 時至翌日上午 7 時；(d) 不得於房間內進行商業活動；(e) 遵守香港所有適用法律。</p>

<h2>八、維修保養</h2>
<p>業主負責主要結構維修及樓宇設施保養。租客則須負責輕微維修，及由租客或其訪客造成之任何損壞。</p>

<h2>九、終止</h2>
<p>任何一方可於租期屆滿前以不少於一 (1) 個月書面通知終止本協議，惟租客於租期首六 (6) 個月內提早終止，按金將被沒收，另有書面約定者除外。</p>

<h2>十、個人資料</h2>
<p>租客知悉業主收集及處理其個人資料（包括身份證件及緊急聯絡人資料）僅用於本租賃事宜，並符合香港《個人資料（私隱）條例》（第 486 章）之規定。</p>

<h2>十一、適用法律</h2>
<p>本協議受香港特別行政區法律管轄並依其詮釋。</p>

<h2>十二、緊急聯絡人</h2>
<p>緊急情況下，請聯絡：</p>
<p>姓名：{{emergencyName}}（{{emergencyRelation}}）<br>
電話：{{emergencyPhone}}<br>
電郵：{{emergencyEmail}}</p>

<h2>簽署</h2>
<p>雙方簽署即確認已閱讀、理解並同意以上所有條款。</p>

<table style="width:100%; margin-top:30px;"><tr>
<td style="width:50%; vertical-align:top; padding-right:20px;">
  <p><strong>業主</strong></p>
  <p style="height:60px; border-bottom:1px solid #333;">&nbsp;</p>
  <p>{{landlordName}}<br>代表：{{landlordRep}}<br>日期：{{contractDate}}</p>
</td>
<td style="width:50%; vertical-align:top; padding-left:20px;">
  <p><strong>租客</strong></p>
  <p style="height:60px; border-bottom:1px solid #333;">{{signaturePlaceholder}}</p>
  <p>{{name}}<br>{{idType}} 號碼：{{idNumber}}<br>日期：{{signatureDate}}</p>
</td>
</tr></table>`

export const DEFAULT_CONTRACT_ZH_CN = `<h1>租赁协议</h1>
<p style="text-align:right; color:#666; font-size:14px;">合同编号：{{bookingId}}<br>日期：{{contractDate}}</p>

<h2>签约双方</h2>
<p><strong>业主：</strong>{{landlordName}}<br>
地址：{{landlordAddress}}<br>
代表人：{{landlordRep}}</p>

<p><strong>租客：</strong>{{name}} {{nameChinese}}<br>
{{idType}} 号码：{{idNumber}}<br>
国籍：{{nationality}}<br>
出生日期：{{dateOfBirth}}<br>
现居地址：{{currentAddress}}<br>
电话：{{phone}}<br>
邮箱：{{email}}</p>

<h2>一、租赁物</h2>
<p>业主同意将位于香港九龙 Demain Life @ 1331 内以下房间出租给租客：</p>
<ul>
  <li><strong>房型：</strong>{{roomType}}</li>
  <li><strong>入住人数：</strong>{{occupancy}} 位</li>
</ul>

<h2>二、租期</h2>
<p>本租赁为定期租约，租期 <strong>{{duration}}</strong>，由 <strong>{{moveInDate}}</strong> 起至 <strong>{{moveOutDate}}</strong> 止（首尾两日包括在内）。</p>

<h2>三、租金</h2>
<p>月租金为 <strong>港币 {{roomPrice}} 元</strong>，须于每月第一天或之前缴付。租金已包括水费、电费（在合理使用上限内）、Wi-Fi 及基本家具；超出合理使用上限之部分将另行计算。</p>

<h2>四、押金</h2>
<p>租客须于签署本协议时缴付相当于 <strong>两 (2) 个月租金（港币 {{depositAmount}} 元）</strong>之可退还押金。押金将于租期届满后 30 天内退还，但须扣除任何未付租金、超过合理损耗范围之损坏，或未结算之杂费。</p>

<h2>五、付款</h2>
<p>签署本协议时应付之款项由业主另行通知租客。接受之付款方式包括转数快（FPS）、转账至业主指定银行账户，或业主同意之其他方式。</p>

<h2>六、使用</h2>
<p>租客只可将租赁物用作住宅用途，未经业主书面同意，不得将租赁物转租、分租或转让予他人。</p>

<h2>七、住户守则</h2>
<p>租客同意遵守 Demain Life 住户守则，包括（但不限于）：(a) 室内禁止吸烟；(b) 未经同意不得饲养宠物；(c) 安静时段为晚上 11 时至次日上午 7 时；(d) 不得于房间内进行商业活动；(e) 遵守香港所有适用法律。</p>

<h2>八、维修保养</h2>
<p>业主负责主要结构维修及楼宇设施保养。租客则须负责轻微维修，及由租客或其访客造成之任何损坏。</p>

<h2>九、终止</h2>
<p>任何一方可于租期届满前以不少于一 (1) 个月书面通知终止本协议，但租客于租期首六 (6) 个月内提前终止，押金将被没收，另有书面约定者除外。</p>

<h2>十、个人信息</h2>
<p>租客知悉业主收集及处理其个人信息（包括身份证件及紧急联系人资料）仅用于本租赁事宜，并符合香港《个人资料（私隐）条例》（第 486 章）之规定。</p>

<h2>十一、适用法律</h2>
<p>本协议受香港特别行政区法律管辖并依其诠释。</p>

<h2>十二、紧急联系人</h2>
<p>紧急情况下，请联系：</p>
<p>姓名：{{emergencyName}}（{{emergencyRelation}}）<br>
电话：{{emergencyPhone}}<br>
邮箱：{{emergencyEmail}}</p>

<h2>签署</h2>
<p>双方签署即确认已阅读、理解并同意以上所有条款。</p>

<table style="width:100%; margin-top:30px;"><tr>
<td style="width:50%; vertical-align:top; padding-right:20px;">
  <p><strong>业主</strong></p>
  <p style="height:60px; border-bottom:1px solid #333;">&nbsp;</p>
  <p>{{landlordName}}<br>代表：{{landlordRep}}<br>日期：{{contractDate}}</p>
</td>
<td style="width:50%; vertical-align:top; padding-left:20px;">
  <p><strong>租客</strong></p>
  <p style="height:60px; border-bottom:1px solid #333;">{{signaturePlaceholder}}</p>
  <p>{{name}}<br>{{idType}} 号码：{{idNumber}}<br>日期：{{signatureDate}}</p>
</td>
</tr></table>`

export const DEFAULT_TERMS_EN = `<h1>House Rules &amp; Tenancy Terms</h1>
<p><em>Version 1 · Effective 2026-06-27</em></p>

<h2>1. Who we are</h2>
<p>Demain Life @ 1331 is a co-living residence operated by Demain Culture Limited at Kai Tak, Kowloon, Hong Kong. These terms govern your stay with us.</p>

<h2>2. Booking and confirmation</h2>
<p>A booking is confirmed only when (a) you have submitted your reservation enquiry, (b) you have completed your profile and uploaded your identity document, (c) you have signed the tenancy agreement, and (d) you have paid the deposit and first instalment.</p>

<h2>3. Payment</h2>
<p>All payments are due in advance. We accept FPS (Faster Payment System), bank transfer, and other methods we may approve. Late payments may incur a charge equivalent to 5% of the outstanding amount.</p>

<h2>4. Use of the premises</h2>
<p>Your room is for residential use only. No commercial activity, no subletting, no overnight guests without prior consent.</p>

<h2>5. Quiet hours</h2>
<p>Quiet hours are between 11:00pm and 7:00am. Please be mindful of your neighbours.</p>

<h2>6. Smoking and pets</h2>
<p>Smoking (including e-cigarettes) is not permitted anywhere inside the building. Pets are not permitted without prior written consent.</p>

<h2>7. Utilities</h2>
<p>Rent includes water, electricity (within fair-use cap), and Wi-Fi. Usage in excess of the fair-use cap will be billed at cost.</p>

<h2>8. Damage and repairs</h2>
<p>You are responsible for damage caused by you or your guests. Please report any maintenance issues promptly.</p>

<h2>9. Termination</h2>
<p>Early termination within the first six months of tenancy results in forfeiture of the security deposit, unless otherwise agreed in writing. Either party may terminate with one month's written notice thereafter.</p>

<h2>10. Personal data</h2>
<p>We handle your personal data in accordance with our <a href="/legal/privacy">Privacy Policy</a>.</p>

<h2>11. Governing law</h2>
<p>These terms are governed by the laws of Hong Kong.</p>

<h2>12. Contact</h2>
<p>For questions, please email us at bookings@demainlife.com.</p>`

export const DEFAULT_TERMS_ZH_HK = `<h1>住戶守則及租賃條款</h1>
<p><em>版本 1 · 2026-06-27 生效</em></p>

<h2>一、關於我們</h2>
<p>Demain Life @ 1331 為 Demain Culture Limited 於香港九龍啟德營運之共居公寓。本條款規範您於此之入住。</p>

<h2>二、預訂及確認</h2>
<p>預訂須於下列各項完成後方告確認：(a) 已提交預訂查詢；(b) 已完成個人資料及上載身份證件；(c) 已簽署租賃協議；(d) 已繳付按金及首期款項。</p>

<h2>三、付款</h2>
<p>所有款項須預付。接受轉數快（FPS）、銀行轉賬，及我們可能批准之其他方式。逾期付款可能須繳付相當於未付金額 5% 之滯納金。</p>

<h2>四、使用</h2>
<p>房間僅作住宅用途。未經同意不得進行商業活動、轉租或留宿訪客。</p>

<h2>五、安靜時段</h2>
<p>安靜時段為晚上 11 時至翌日上午 7 時，請尊重鄰居。</p>

<h2>六、吸煙及寵物</h2>
<p>大樓內任何地方均禁止吸煙（包括電子煙）。未經書面同意不得飼養寵物。</p>

<h2>七、水電費</h2>
<p>租金已包括水費、電費（合理使用上限內）及 Wi-Fi。超出部分將按成本另行計算。</p>

<h2>八、損壞及維修</h2>
<p>您須對自己或訪客造成之損壞負責。請及時報告任何維修事宜。</p>

<h2>九、終止</h2>
<p>租期首六個月內提早終止將導致按金被沒收，另有書面約定者除外。此後任何一方可以一個月書面通知終止。</p>

<h2>十、個人資料</h2>
<p>我們依照<a href="/legal/privacy">私隱政策</a>處理您的個人資料。</p>

<h2>十一、適用法律</h2>
<p>本條款受香港法律管轄。</p>

<h2>十二、聯絡</h2>
<p>查詢請電郵 bookings@demainlife.com。</p>`

export const DEFAULT_TERMS_ZH_CN = `<h1>住户守则及租赁条款</h1>
<p><em>版本 1 · 2026-06-27 生效</em></p>

<h2>一、关于我们</h2>
<p>Demain Life @ 1331 为 Demain Culture Limited 于香港九龙启德运营之共居公寓。本条款规范您于此之入住。</p>

<h2>二、预订及确认</h2>
<p>预订须于下列各项完成后方告确认：(a) 已提交预订咨询；(b) 已完成个人资料及上传身份证件；(c) 已签署租赁协议；(d) 已缴付押金及首期款项。</p>

<h2>三、付款</h2>
<p>所有款项须预付。接受转数快（FPS）、银行转账，及我们可能批准之其他方式。逾期付款可能须缴付相当于未付金额 5% 之滞纳金。</p>

<h2>四、使用</h2>
<p>房间仅作住宅用途。未经同意不得进行商业活动、转租或留宿访客。</p>

<h2>五、安静时段</h2>
<p>安静时段为晚上 11 时至次日上午 7 时，请尊重邻居。</p>

<h2>六、吸烟及宠物</h2>
<p>大楼内任何地方均禁止吸烟（包括电子烟）。未经书面同意不得饲养宠物。</p>

<h2>七、水电费</h2>
<p>租金已包括水费、电费（合理使用上限内）及 Wi-Fi。超出部分将按成本另行计算。</p>

<h2>八、损坏及维修</h2>
<p>您须对自己或访客造成之损坏负责。请及时报告任何维修事宜。</p>

<h2>九、终止</h2>
<p>租期首六个月内提前终止将导致押金被没收，另有书面约定者除外。此后任何一方可以一个月书面通知终止。</p>

<h2>十、个人信息</h2>
<p>我们依照<a href="/legal/privacy">隐私政策</a>处理您的个人信息。</p>

<h2>十一、适用法律</h2>
<p>本条款受香港法律管辖。</p>

<h2>十二、联系</h2>
<p>查询请邮件 bookings@demainlife.com。</p>`

export const DEFAULT_PRIVACY_EN = `<h1>Privacy Policy</h1>
<p><em>Version 1 · Effective 2026-06-27</em></p>

<p>Demain Culture Limited ("we", "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal data when you book a stay with us.</p>

<h2>1. What we collect</h2>
<ul>
  <li>Contact details (name, email, phone, address)</li>
  <li>Identity documents (HK ID, passport, China ID, or other) — front and back photos</li>
  <li>Personal information (date of birth, gender, nationality, occupation)</li>
  <li>Emergency contact details</li>
  <li>Payment information (FPS / bank transfer details, payment screenshots)</li>
  <li>Tenancy and signature records</li>
</ul>

<h2>2. Why we collect it</h2>
<p>We collect personal data solely to: (a) process your booking and tenancy; (b) verify your identity; (c) comply with legal obligations; (d) communicate with you and your emergency contact when necessary; (e) maintain records as required by law.</p>

<h2>3. How we store it</h2>
<p>Personal data is stored in Google Workspace (Sheets and Drive) hosted in approved data regions, and in Cloudflare KV. We use industry-standard encryption in transit and at rest.</p>

<h2>4. AI-assisted processing</h2>
<p>With your consent, we may use xAI Grok Vision to extract information from your identity document to pre-fill the form. The image is transmitted to xAI for this single purpose. xAI does not retain images for model training. You may decline this and complete the form manually.</p>

<h2>5. Who can access it</h2>
<p>Access is limited to Demain Life authorised staff with a need-to-know basis. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

<h2>6. How long we keep it</h2>
<p>We keep your data for the duration of your tenancy and for seven (7) years thereafter, as required by Hong Kong tax and accounting law. After that, we securely delete the data.</p>

<h2>7. Your rights under PDPO</h2>
<p>Under the Personal Data (Privacy) Ordinance (Cap. 486), you have the right to: (a) access your personal data; (b) correct inaccuracies; (c) request deletion (subject to legal retention requirements); (d) withdraw consent for AI-assisted processing.</p>

<h2>8. Contact</h2>
<p>For any privacy request, please email bookings@demainlife.com.</p>`

export const DEFAULT_PRIVACY_ZH_HK = `<h1>私隱政策</h1>
<p><em>版本 1 · 2026-06-27 生效</em></p>

<p>Demain Culture Limited（「我們」）尊重您的私隱。本政策說明當您於我們處預訂入住時，我們如何收集、使用及保護您的個人資料。</p>

<h2>一、我們收集的資料</h2>
<ul>
  <li>聯絡資料（姓名、電郵、電話、地址）</li>
  <li>身份證件（香港身份證、護照、中國身份證或其他）—— 正反兩面照片</li>
  <li>個人資料（出生日期、性別、國籍、職業）</li>
  <li>緊急聯絡人資料</li>
  <li>付款資料（FPS／銀行轉賬資料、付款截圖）</li>
  <li>租賃及簽署紀錄</li>
</ul>

<h2>二、收集目的</h2>
<p>我們收集個人資料僅用於：(a) 處理您的預訂及租賃；(b) 核實身份；(c) 履行法律義務；(d) 必要時與您及您的緊急聯絡人溝通；(e) 依法保存紀錄。</p>

<h2>三、儲存方式</h2>
<p>個人資料儲存於 Google Workspace（Sheets 及 Drive）及 Cloudflare KV。傳輸及儲存均使用業界標準加密。</p>

<h2>四、AI 輔助處理</h2>
<p>經您同意，我們會使用 xAI Grok Vision 從您的身份證件中提取資料以預填表格。圖片僅為此目的傳送至 xAI 一次，xAI 不會保留圖片作模型訓練。您可拒絕並改為手動填寫。</p>

<h2>五、可存取者</h2>
<p>僅 Demain Life 經授權職員可基於需要存取。我們不會出售、出租或將您的個人資料用於市場推廣。</p>

<h2>六、保存期限</h2>
<p>我們會於租期內及其後 7 年保存您的資料，以符合香港稅務及會計法律要求。其後將安全刪除。</p>

<h2>七、您於 PDPO 下的權利</h2>
<p>依《個人資料（私隱）條例》（第 486 章），您有權：(a) 查閱個人資料；(b) 更正錯誤；(c) 要求刪除（在法律保存期限外）；(d) 撤回 AI 輔助處理之同意。</p>

<h2>八、聯絡</h2>
<p>任何私隱查詢請電郵 bookings@demainlife.com。</p>`

export const DEFAULT_PRIVACY_ZH_CN = `<h1>隐私政策</h1>
<p><em>版本 1 · 2026-06-27 生效</em></p>

<p>Demain Culture Limited（"我们"）尊重您的隐私。本政策说明当您于我们处预订入住时，我们如何收集、使用及保护您的个人信息。</p>

<h2>一、我们收集的信息</h2>
<ul>
  <li>联系信息（姓名、邮箱、电话、地址）</li>
  <li>身份证件（香港身份证、护照、中国身份证或其他）—— 正反两面照片</li>
  <li>个人信息（出生日期、性别、国籍、职业）</li>
  <li>紧急联系人信息</li>
  <li>付款信息（FPS／银行转账资料、付款截图）</li>
  <li>租赁及签署记录</li>
</ul>

<h2>二、收集目的</h2>
<p>我们收集个人信息仅用于：(a) 处理您的预订及租赁；(b) 核实身份；(c) 履行法律义务；(d) 必要时与您及您的紧急联系人沟通；(e) 依法保存记录。</p>

<h2>三、储存方式</h2>
<p>个人信息储存于 Google Workspace（Sheets 及 Drive）及 Cloudflare KV。传输及储存均使用业界标准加密。</p>

<h2>四、AI 辅助处理</h2>
<p>经您同意，我们会使用 xAI Grok Vision 从您的身份证件中提取信息以预填表格。图片仅为此目的传送至 xAI 一次，xAI 不会保留图片作模型训练。您可拒绝并改为手动填写。</p>

<h2>五、可访问者</h2>
<p>仅 Demain Life 经授权职员可基于需要访问。我们不会出售、出租或将您的个人信息用于市场推广。</p>

<h2>六、保存期限</h2>
<p>我们会于租期内及其后 7 年保存您的信息，以符合香港税务及会计法律要求。其后将安全删除。</p>

<h2>七、您于 PDPO 下的权利</h2>
<p>依《个人资料（私隐）条例》（第 486 章），您有权：(a) 访问个人信息；(b) 更正错误；(c) 要求删除（在法律保存期限外）；(d) 撤回 AI 辅助处理之同意。</p>

<h2>八、联系</h2>
<p>任何隐私查询请邮件 bookings@demainlife.com。</p>`

export const DEFAULT_LEGAL = {
  contract: {
    en: DEFAULT_CONTRACT_EN,
    'zh-HK': DEFAULT_CONTRACT_ZH_HK,
    'zh-CN': DEFAULT_CONTRACT_ZH_CN
  },
  terms: {
    en: DEFAULT_TERMS_EN,
    'zh-HK': DEFAULT_TERMS_ZH_HK,
    'zh-CN': DEFAULT_TERMS_ZH_CN
  },
  privacy: {
    en: DEFAULT_PRIVACY_EN,
    'zh-HK': DEFAULT_PRIVACY_ZH_HK,
    'zh-CN': DEFAULT_PRIVACY_ZH_CN
  },
  // Default landlord info — editable in admin
  landlord: {
    name: 'Demain Culture Limited',
    address: 'Demain Life @ 1331, Kai Tak, Kowloon, Hong Kong',
    representative: 'Tat Lam',
    bankName: 'ZA Bank',
    bankAccountNumber: '882002273557',
    bankAccountName: 'Demain Culture Limited',
    fpsId: '115403669',
    fpsQrUrl: '/payment/fps-qr.jpg'
  }
}
