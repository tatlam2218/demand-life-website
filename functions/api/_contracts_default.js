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

// ─── Shop Terms & Conditions ─────────────────────────────────────────────────

export const DEFAULT_SHOP_TERMS_EN = `<h1>Shop Terms &amp; Conditions</h1>
<p><em>Version 1 · Effective 2026-07-01</em></p>

<p>These Terms &amp; Conditions govern all purchases made through the Demain Life online shop, operated by Demain Culture Limited ("we", "us", "our") at Demain Life @ 1331, Kai Tak, Kowloon, Hong Kong.</p>

<h2>1. Acceptance of Terms</h2>
<p>By placing an order you confirm that you are at least 18 years old and agree to be bound by these Terms &amp; Conditions, our <a href="/legal/privacy">Privacy Policy</a>, our <a href="/legal/refund">Refund Policy</a>, and our <a href="/legal/shipping">Shipping Policy</a>.</p>

<h2>2. Products</h2>
<p>All products are subject to availability. We reserve the right to discontinue any product at any time. Product images are for illustration purposes; actual products may vary slightly in colour or appearance due to photography and screen settings.</p>

<h2>3. Pricing</h2>
<p>All prices are quoted in Hong Kong Dollars (HKD) and are inclusive of applicable taxes. We reserve the right to change prices at any time without prior notice. The price charged will be the price displayed at the time of order confirmation.</p>

<h2>4. Orders</h2>
<p>Submitting an order constitutes an offer to purchase. We reserve the right to accept or reject any order. An order is confirmed only when we send you an order confirmation by email. We may cancel orders in the event of pricing errors, stock unavailability, or suspected fraud.</p>

<h2>5. Payment</h2>
<p>We accept payment via QFPay (credit card, Alipay, WeChat Pay), FPS, and bank transfer. Payment must be completed before goods are dispatched or made available for pickup. We use QFPay as our payment processor; your card details are handled securely by QFPay and are not stored by us.</p>

<h2>6. Delivery &amp; Shipping</h2>
<p>Please refer to our <a href="/legal/shipping">Shipping Policy</a> for details on delivery options, timeframes, and charges.</p>

<h2>7. Returns &amp; Refunds</h2>
<p>Please refer to our <a href="/legal/refund">Refund Policy</a> for details on returns, exchanges, and refunds.</p>

<h2>8. Intellectual Property</h2>
<p>All content on this website — including images, text, logos, and product designs — is the property of Demain Culture Limited or its licensors and is protected by copyright. You may not reproduce or use any content without our prior written consent.</p>

<h2>9. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential loss arising from your use of our shop or products. Our total liability to you shall not exceed the amount paid for the relevant order.</p>

<h2>10. Personal Data</h2>
<p>We collect and process your personal data in accordance with our <a href="/legal/privacy">Privacy Policy</a> and the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong.</p>

<h2>11. Governing Law</h2>
<p>These Terms &amp; Conditions are governed by the laws of the Hong Kong Special Administrative Region. Any dispute shall be subject to the exclusive jurisdiction of the Hong Kong courts.</p>

<h2>12. Contact</h2>
<p>For any questions about your order, please email <a href="mailto:shop@demainlife.com">shop@demainlife.com</a> or WhatsApp us at the number on our website.</p>`

export const DEFAULT_SHOP_TERMS_ZH_HK = `<h1>購物條款及細則</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本條款及細則規範所有透過 Demain Life 網上商店進行之購買，商店由 Demain Culture Limited（「我們」）於香港九龍啟德 Demain Life @ 1331 營運。</p>

<h2>一、接受條款</h2>
<p>提交訂單即表示您確認年滿 18 歲，並同意受本條款及細則、<a href="/legal/privacy">私隱政策</a>、<a href="/legal/refund">退款政策</a>及<a href="/legal/shipping">送貨政策</a>約束。</p>

<h2>二、產品</h2>
<p>所有產品視乎庫存情況而定。我們保留隨時停售任何產品之權利。產品圖片僅供參考，實際產品顏色或外觀可能因攝影及螢幕設定而略有差異。</p>

<h2>三、價格</h2>
<p>所有價格以港幣（HKD）報價並已包含適用稅款。我們保留隨時更改價格之權利，恕不另行通知。收取費用將以下單確認時顯示之價格為準。</p>

<h2>四、訂單</h2>
<p>提交訂單即構成購買要約。我們保留接受或拒絕任何訂單之權利。訂單確認後我們將發送確認電郵。如發生定價錯誤、缺貨或懷疑欺詐，我們可取消訂單。</p>

<h2>五、付款</h2>
<p>我們接受 QFPay（信用卡、支付寶、微信支付）、轉數快及銀行轉賬。貨品須於付款完成後方可發貨或安排取貨。我們使用 QFPay 處理付款，您的卡片資料由 QFPay 安全處理，我們不會儲存相關資料。</p>

<h2>六、送貨</h2>
<p>詳情請參閱<a href="/legal/shipping">送貨政策</a>。</p>

<h2>七、退款</h2>
<p>詳情請參閱<a href="/legal/refund">退款政策</a>。</p>

<h2>八、知識產權</h2>
<p>本網站所有內容（包括圖片、文字、標誌及產品設計）均為 Demain Culture Limited 或其授權人之財產，受版權保護。未經我們事先書面同意，不得複製或使用任何內容。</p>

<h2>九、責任限制</h2>
<p>在法律許可的最大範圍內，我們不對因使用商店或產品而引起之任何間接、附帶或相應損失負責。我們對您的總責任不超過相關訂單所支付之金額。</p>

<h2>十、個人資料</h2>
<p>我們依照<a href="/legal/privacy">私隱政策</a>及《個人資料（私隱）條例》（第 486 章）收集及處理您的個人資料。</p>

<h2>十一、適用法律</h2>
<p>本條款受香港特別行政區法律管轄。任何爭議須受香港法院專屬司法管轄。</p>

<h2>十二、聯絡</h2>
<p>如有任何訂單查詢，請電郵 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a> 或透過網站上之 WhatsApp 聯絡我們。</p>`

export const DEFAULT_SHOP_TERMS_ZH_CN = `<h1>购物条款及细则</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本条款及细则规范所有通过 Demain Life 网上商店进行之购买，商店由 Demain Culture Limited（"我们"）于香港九龙启德 Demain Life @ 1331 运营。</p>

<h2>一、接受条款</h2>
<p>提交订单即表示您确认年满 18 岁，并同意受本条款及细则、<a href="/legal/privacy">隐私政策</a>、<a href="/legal/refund">退款政策</a>及<a href="/legal/shipping">配送政策</a>约束。</p>

<h2>二、产品</h2>
<p>所有产品视库存情况而定。我们保留随时停售任何产品之权利。产品图片仅供参考，实际产品颜色或外观可能因摄影及屏幕设置略有差异。</p>

<h2>三、价格</h2>
<p>所有价格以港币（HKD）报价并已含适用税款。我们保留随时更改价格之权利，恕不另行通知。收取费用将以下单确认时显示之价格为准。</p>

<h2>四、订单</h2>
<p>提交订单即构成购买要约。我们保留接受或拒绝任何订单之权利。订单确认后我们将发送确认邮件。如发生定价错误、缺货或疑似欺诈，我们可取消订单。</p>

<h2>五、付款</h2>
<p>我们接受 QFPay（信用卡、支付宝、微信支付）、FPS 及银行转账。货品须于付款完成后方可发货或安排取货。我们使用 QFPay 处理付款，您的卡片资料由 QFPay 安全处理，我们不会储存相关资料。</p>

<h2>六、配送</h2>
<p>详情请参阅<a href="/legal/shipping">配送政策</a>。</p>

<h2>七、退款</h2>
<p>详情请参阅<a href="/legal/refund">退款政策</a>。</p>

<h2>八、知识产权</h2>
<p>本网站所有内容（包括图片、文字、标志及产品设计）均为 Demain Culture Limited 或其授权人之财产，受版权保护。未经我们事先书面同意，不得复制或使用任何内容。</p>

<h2>九、责任限制</h2>
<p>在法律许可的最大范围内，我们不对因使用商店或产品而引起之任何间接、附带或相应损失负责。我们对您的总责任不超过相关订单所支付之金额。</p>

<h2>十、个人信息</h2>
<p>我们依照<a href="/legal/privacy">隐私政策</a>及《个人资料（私隐）条例》（第 486 章）收集及处理您的个人信息。</p>

<h2>十一、适用法律</h2>
<p>本条款受香港特别行政区法律管辖。任何争议须受香港法院专属司法管辖。</p>

<h2>十二、联系</h2>
<p>如有任何订单查询，请邮件 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a> 或通过网站上之 WhatsApp 联系我们。</p>`

// ─── Refund Policy ───────────────────────────────────────────────────────────

export const DEFAULT_REFUND_EN = `<h1>Refund Policy</h1>
<p><em>Version 1 · Effective 2026-07-01</em></p>

<p>We want you to be completely satisfied with your purchase. If you are not happy with your order, please read our refund policy below.</p>

<h2>1. Returns</h2>
<p>We accept returns within <strong>7 days</strong> of receipt of your order, provided that:</p>
<ul>
  <li>The item is unused and in its original condition and packaging</li>
  <li>You have proof of purchase (order confirmation email)</li>
  <li>The item is not a final-sale or custom-made item (see Section 5)</li>
</ul>
<p>To initiate a return, please email <a href="mailto:shop@demainlife.com">shop@demainlife.com</a> with your order number and reason for return. We will respond within 2 business days.</p>

<h2>2. Refunds</h2>
<p>Once we receive and inspect the returned item, we will notify you by email. If the return is approved:</p>
<ul>
  <li>Refunds will be processed within <strong>7 business days</strong></li>
  <li>Refunds will be issued to the original payment method</li>
  <li>For QFPay payments, the refund will appear on your card or e-wallet within 5–14 business days depending on your bank or payment provider</li>
  <li>For FPS / bank transfer, refunds will be made to the bank account you provide</li>
</ul>
<p>Shipping fees are non-refundable unless the return is due to our error or a defective product.</p>

<h2>3. Exchanges</h2>
<p>We offer exchanges for the same item in a different variant (e.g. size, colour) within 7 days, subject to availability. If you require an exchange, please email us with your order number and the desired variant.</p>

<h2>4. Damaged or Incorrect Items</h2>
<p>If you receive a damaged or incorrect item, please email us within <strong>48 hours</strong> of receipt with photos of the item and packaging. We will arrange a replacement or full refund at no extra cost to you.</p>

<h2>5. Non-Returnable Items</h2>
<p>The following items are not eligible for return or refund:</p>
<ul>
  <li>Final-sale or clearly marked discounted items</li>
  <li>Custom-made or personalised items</li>
  <li>Perishable goods</li>
  <li>Items that have been used, washed, or altered</li>
  <li>Digital products or downloadable content</li>
</ul>

<h2>6. Return Shipping</h2>
<p>Customers are responsible for return shipping costs unless the return is due to our error or a defective item. We recommend using a trackable shipping method. We are not responsible for lost return parcels.</p>

<h2>7. Contact</h2>
<p>For all refund and return enquiries, please email <a href="mailto:shop@demainlife.com">shop@demainlife.com</a>.</p>`

export const DEFAULT_REFUND_ZH_HK = `<h1>退款政策</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>我們希望您對購買感到完全滿意。如您對訂單不滿意，請閱讀以下退款政策。</p>

<h2>一、退貨</h2>
<p>我們接受於收貨後 <strong>7 天內</strong>退貨，前提是：</p>
<ul>
  <li>商品未使用，狀態及包裝完好如初</li>
  <li>您持有購買證明（訂單確認電郵）</li>
  <li>商品並非最終銷售或定製商品（見第五條）</li>
</ul>
<p>如需退貨，請電郵 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a> 並提供訂單編號及退貨原因。我們將於 2 個工作天內回覆。</p>

<h2>二、退款</h2>
<p>收到並檢查退回商品後，我們將以電郵通知您。如退貨獲批：</p>
<ul>
  <li>退款將於 <strong>7 個工作天</strong>內處理</li>
  <li>退款將退回原付款方式</li>
  <li>QFPay 付款之退款，視乎您的銀行或付款機構，將於 5–14 個工作天內反映於您的信用卡或電子錢包</li>
  <li>轉數快／銀行轉賬之退款，將退回您提供的銀行戶口</li>
</ul>
<p>除非退貨原因為我方錯誤或商品瑕疵，否則運費概不退還。</p>

<h2>三、換貨</h2>
<p>我們接受於 7 天內就同一商品之不同版本（如尺寸、顏色）換貨，視乎庫存而定。如需換貨，請電郵我們並提供訂單編號及所需版本。</p>

<h2>四、損壞或錯誤商品</h2>
<p>如收到損壞或錯誤商品，請於收貨後 <strong>48 小時內</strong>電郵我們並附上商品及包裝照片。我們將安排換貨或全額退款，不收取額外費用。</p>

<h2>五、不可退貨商品</h2>
<p>以下商品不可退貨或退款：</p>
<ul>
  <li>最終銷售或明確標示折扣之商品</li>
  <li>定製或個人化商品</li>
  <li>易腐物品</li>
  <li>已使用、清洗或更改之商品</li>
  <li>數碼產品或可下載內容</li>
</ul>

<h2>六、退貨運費</h2>
<p>除非退貨原因為我方錯誤或商品瑕疵，否則退貨運費由顧客自行承擔。建議使用可追蹤的寄送方式。遺失之退貨包裹概不負責。</p>

<h2>七、聯絡</h2>
<p>所有退款及退貨查詢請電郵 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a>。</p>`

export const DEFAULT_REFUND_ZH_CN = `<h1>退款政策</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>我们希望您对购买感到完全满意。如您对订单不满意，请阅读以下退款政策。</p>

<h2>一、退货</h2>
<p>我们接受于收货后 <strong>7 天内</strong>退货，前提是：</p>
<ul>
  <li>商品未使用，状态及包装完好如初</li>
  <li>您持有购买证明（订单确认邮件）</li>
  <li>商品并非最终销售或定制商品（见第五条）</li>
</ul>
<p>如需退货，请邮件 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a> 并提供订单编号及退货原因。我们将于 2 个工作日内回复。</p>

<h2>二、退款</h2>
<p>收到并检查退回商品后，我们将以邮件通知您。如退货获批：</p>
<ul>
  <li>退款将于 <strong>7 个工作日</strong>内处理</li>
  <li>退款将退回原付款方式</li>
  <li>QFPay 付款之退款，视乎您的银行或付款机构，将于 5–14 个工作日内反映于您的信用卡或电子钱包</li>
  <li>FPS／银行转账之退款，将退回您提供的银行账户</li>
</ul>
<p>除非退货原因为我方错误或商品瑕疵，否则运费概不退还。</p>

<h2>三、换货</h2>
<p>我们接受于 7 天内就同一商品之不同版本（如尺寸、颜色）换货，视库存而定。如需换货，请邮件我们并提供订单编号及所需版本。</p>

<h2>四、损坏或错误商品</h2>
<p>如收到损坏或错误商品，请于收货后 <strong>48 小时内</strong>邮件我们并附上商品及包装照片。我们将安排换货或全额退款，不收取额外费用。</p>

<h2>五、不可退货商品</h2>
<p>以下商品不可退货或退款：</p>
<ul>
  <li>最终销售或明确标示折扣之商品</li>
  <li>定制或个性化商品</li>
  <li>易腐物品</li>
  <li>已使用、清洗或更改之商品</li>
  <li>数码产品或可下载内容</li>
</ul>

<h2>六、退货运费</h2>
<p>除非退货原因为我方错误或商品瑕疵，否则退货运费由顾客自行承担。建议使用可追踪的寄送方式。遗失之退货包裹概不负责。</p>

<h2>七、联系</h2>
<p>所有退款及退货查询请邮件 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a>。</p>`

// ─── Shipping Policy ──────────────────────────────────────────────────────────

export const DEFAULT_SHIPPING_EN = `<h1>Shipping Policy</h1>
<p><em>Version 1 · Effective 2026-07-01</em></p>

<p>This Shipping Policy applies to all orders placed through the Demain Life online shop.</p>

<h2>1. Delivery Options</h2>
<p>We offer two delivery options at checkout:</p>
<ul>
  <li><strong>Pickup at Demain Life @ 1331</strong> — Free. We will notify you by email or WhatsApp when your order is ready for collection. Please collect within 14 days of notification. Bring your order confirmation.</li>
  <li><strong>Shipping to address</strong> — Available for Hong Kong and selected international destinations.</li>
</ul>

<h2>2. Shipping Fees</h2>
<table style="width:100%; border-collapse:collapse; margin:0.8rem 0;">
  <thead><tr style="background:#f4f1ea;">
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Destination</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Fee</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Estimated Delivery</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">Hong Kong</td><td style="padding:8px 12px; border:1px solid #ddd;">HK$50</td><td style="padding:8px 12px; border:1px solid #ddd;">2–4 business days</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">China (Mainland)</td><td style="padding:8px 12px; border:1px solid #ddd;">Quoted separately</td><td style="padding:8px 12px; border:1px solid #ddd;">5–10 business days</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">Taiwan / Macau</td><td style="padding:8px 12px; border:1px solid #ddd;">Quoted separately</td><td style="padding:8px 12px; border:1px solid #ddd;">5–10 business days</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">Japan / Singapore</td><td style="padding:8px 12px; border:1px solid #ddd;">Quoted separately</td><td style="padding:8px 12px; border:1px solid #ddd;">7–14 business days</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">Other international</td><td style="padding:8px 12px; border:1px solid #ddd;">Quoted separately</td><td style="padding:8px 12px; border:1px solid #ddd;">10–21 business days</td></tr>
  </tbody>
</table>
<p>For international orders, our staff will contact you with a shipping quote before processing. You may cancel the order at no charge before confirming the shipping fee.</p>

<h2>3. Processing Time</h2>
<p>Orders are processed within <strong>1–2 business days</strong> after payment is confirmed. Orders placed on weekends or public holidays will be processed on the next business day.</p>

<h2>4. Tracking</h2>
<p>Once your order has been dispatched, we will send you a tracking number by email. You can track your parcel with the carrier using the link provided.</p>

<h2>5. Customs &amp; Import Duties</h2>
<p>For international shipments, customs duties, import taxes, and handling fees may apply in the destination country. These charges are the responsibility of the recipient. We have no control over these charges and cannot predict their amount.</p>

<h2>6. Undeliverable Parcels</h2>
<p>If a parcel is returned to us due to an incorrect address or failure to collect, we will contact you. Re-shipping charges will apply. We are not responsible for parcels lost due to an incorrect address provided by the customer.</p>

<h2>7. Lost or Damaged in Transit</h2>
<p>If your parcel is lost or damaged in transit, please contact us within 7 days of the expected delivery date. We will file a claim with the carrier and arrange a replacement or refund as appropriate.</p>

<h2>8. Contact</h2>
<p>For shipping enquiries, please email <a href="mailto:shop@demainlife.com">shop@demainlife.com</a>.</p>`

export const DEFAULT_SHIPPING_ZH_HK = `<h1>送貨政策</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本送貨政策適用於所有透過 Demain Life 網上商店提交之訂單。</p>

<h2>一、送貨選項</h2>
<p>我們於結賬時提供兩種送貨方式：</p>
<ul>
  <li><strong>於 Demain Life @ 1331 自取</strong>——免費。訂單就緒後我們將以電郵或 WhatsApp 通知您。請於通知後 14 天內憑訂單確認書取貨。</li>
  <li><strong>寄送至地址</strong>——適用於香港及部分海外目的地。</li>
</ul>

<h2>二、運費</h2>
<table style="width:100%; border-collapse:collapse; margin:0.8rem 0;">
  <thead><tr style="background:#f4f1ea;">
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">目的地</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">運費</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">預計送達</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">香港</td><td style="padding:8px 12px; border:1px solid #ddd;">HK$50</td><td style="padding:8px 12px; border:1px solid #ddd;">2–4 個工作天</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">中國內地</td><td style="padding:8px 12px; border:1px solid #ddd;">另行報價</td><td style="padding:8px 12px; border:1px solid #ddd;">5–10 個工作天</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">台灣 / 澳門</td><td style="padding:8px 12px; border:1px solid #ddd;">另行報價</td><td style="padding:8px 12px; border:1px solid #ddd;">5–10 個工作天</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">日本 / 新加坡</td><td style="padding:8px 12px; border:1px solid #ddd;">另行報價</td><td style="padding:8px 12px; border:1px solid #ddd;">7–14 個工作天</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">其他海外</td><td style="padding:8px 12px; border:1px solid #ddd;">另行報價</td><td style="padding:8px 12px; border:1px solid #ddd;">10–21 個工作天</td></tr>
  </tbody>
</table>
<p>海外訂單我們將於處理前聯絡您提供運費報價。您可於確認運費前免費取消訂單。</p>

<h2>三、處理時間</h2>
<p>付款確認後，訂單將於 <strong>1–2 個工作天</strong>內處理。週末或公眾假期提交之訂單將於下一個工作天處理。</p>

<h2>四、追蹤</h2>
<p>訂單發貨後我們將以電郵發送追蹤號碼，您可透過附上之連結追蹤包裹。</p>

<h2>五、關稅及進口稅</h2>
<p>海外運送可能於目的地徵收關稅、進口稅及處理費，由收件人負責。我們對此等費用無法控制，亦無法預估金額。</p>

<h2>六、無法送達之包裹</h2>
<p>如包裹因地址錯誤或未能取件而退回，我們將聯絡您。重新寄送須支付運費。因顧客提供錯誤地址而導致包裹遺失，概不負責。</p>

<h2>七、運送途中遺失或損壞</h2>
<p>如包裹於運送途中遺失或損壞，請於預計送達日期後 7 天內聯絡我們。我們將向承運商提出索賠，並視情況安排換貨或退款。</p>

<h2>八、聯絡</h2>
<p>送貨查詢請電郵 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a>。</p>`

export const DEFAULT_SHIPPING_ZH_CN = `<h1>配送政策</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本配送政策适用于所有通过 Demain Life 网上商店提交之订单。</p>

<h2>一、配送选项</h2>
<p>我们于结账时提供两种配送方式：</p>
<ul>
  <li><strong>于 Demain Life @ 1331 自取</strong>——免费。订单就绪后我们将以邮件或 WhatsApp 通知您。请于通知后 14 天内凭订单确认书取货。</li>
  <li><strong>寄送至地址</strong>——适用于香港及部分海外目的地。</li>
</ul>

<h2>二、运费</h2>
<table style="width:100%; border-collapse:collapse; margin:0.8rem 0;">
  <thead><tr style="background:#f4f1ea;">
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">目的地</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">运费</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">预计送达</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">香港</td><td style="padding:8px 12px; border:1px solid #ddd;">HK$50</td><td style="padding:8px 12px; border:1px solid #ddd;">2–4 个工作日</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">中国内地</td><td style="padding:8px 12px; border:1px solid #ddd;">另行报价</td><td style="padding:8px 12px; border:1px solid #ddd;">5–10 个工作日</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">台湾 / 澳门</td><td style="padding:8px 12px; border:1px solid #ddd;">另行报价</td><td style="padding:8px 12px; border:1px solid #ddd;">5–10 个工作日</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">日本 / 新加坡</td><td style="padding:8px 12px; border:1px solid #ddd;">另行报价</td><td style="padding:8px 12px; border:1px solid #ddd;">7–14 个工作日</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">其他海外</td><td style="padding:8px 12px; border:1px solid #ddd;">另行报价</td><td style="padding:8px 12px; border:1px solid #ddd;">10–21 个工作日</td></tr>
  </tbody>
</table>
<p>海外订单我们将于处理前联系您提供运费报价。您可于确认运费前免费取消订单。</p>

<h2>三、处理时间</h2>
<p>付款确认后，订单将于 <strong>1–2 个工作日</strong>内处理。周末或公众假期提交之订单将于下一个工作日处理。</p>

<h2>四、追踪</h2>
<p>订单发货后我们将以邮件发送追踪号码，您可通过附上之链接追踪包裹。</p>

<h2>五、关税及进口税</h2>
<p>海外运送可能于目的地征收关税、进口税及处理费，由收件人负责。我们对此等费用无法控制，亦无法预估金额。</p>

<h2>六、无法送达之包裹</h2>
<p>如包裹因地址错误或未能取件而退回，我们将联系您。重新寄送须支付运费。因顾客提供错误地址而导致包裹遗失，概不负责。</p>

<h2>七、运送途中遗失或损坏</h2>
<p>如包裹于运送途中遗失或损坏，请于预计送达日期后 7 天内联系我们。我们将向承运商提出索赔，并视情况安排换货或退款。</p>

<h2>八、联系</h2>
<p>配送查询请邮件 <a href="mailto:shop@demainlife.com">shop@demainlife.com</a>。</p>`

// ─── Stay Terms & Conditions ──────────────────────────────────────────────────

export const DEFAULT_STAY_TERMS_EN = `<h1>Stay Terms &amp; Conditions</h1>
<p><em>Version 1 · Effective 2026-07-01</em></p>

<p>These Terms &amp; Conditions apply to all accommodation bookings at Demain Life @ 1331, operated by Demain Culture Limited ("we", "us") at Kai Tak, Kowloon, Hong Kong.</p>

<h2>1. Booking Process</h2>
<p>A booking is only confirmed after all four steps are completed: (a) you submit a reservation enquiry; (b) you complete your profile and upload your identity document; (c) you sign the tenancy agreement; and (d) you pay the security deposit and first instalment. No accommodation right arises until all four steps are complete.</p>

<h2>2. Accommodation</h2>
<p>Demain Life @ 1331 provides co-living rooms at Kai Tak, Kowloon, Hong Kong. Room types and available inventory are subject to change. We will confirm your allocated room type at the tenancy agreement stage.</p>

<h2>3. Rent and Fees</h2>
<p>Monthly rent and applicable fees are as quoted at the time of booking confirmation. Rent is payable in advance on or before the first day of each calendar month. Rent includes water, electricity (within the fair-use cap), and Wi-Fi. Usage in excess of the fair-use cap is billed separately.</p>

<h2>4. Security Deposit</h2>
<p>A refundable security deposit equivalent to two (2) months' rent is required upon signing the tenancy agreement. The deposit will be returned within 30 days after the end of the tenancy, less any deductions for unpaid rent, damage beyond fair wear and tear, or outstanding utility charges.</p>

<h2>5. Payment</h2>
<p>We accept FPS (Faster Payment System) and bank transfer. Payment must be made in Hong Kong Dollars (HKD). Your booking reference must be included in all transfer notes. A payment confirmation screenshot must be submitted through the payment page. Please refer to our <a href="/legal/stay-refund">Cancellation &amp; Refund Policy</a> for the payment scenario at each stage.</p>

<h2>6. House Rules</h2>
<p>Tenants must comply with Demain Life house rules, including but not limited to: (a) no smoking inside the building; (b) no pets without prior written consent; (c) quiet hours between 11 pm and 7 am; (d) no commercial activity; (e) no subletting or sharing without consent; (f) compliance with all applicable Hong Kong laws.</p>

<h2>7. Check-in and Check-out</h2>
<p>Check-in and check-out times will be confirmed in your tenancy agreement. Early check-in or late check-out may be arranged subject to availability and may incur additional charges.</p>

<h2>8. Termination</h2>
<p>Either party may terminate the tenancy with one month's written notice. Early termination within the first six months of the tenancy by the tenant will result in forfeiture of the security deposit, unless otherwise agreed in writing.</p>

<h2>9. Identity Verification</h2>
<p>We are required by law to verify the identity of all tenants. You must upload a clear photo of your identity document (HK ID, passport, or China ID) during the booking process. False or misleading information will result in immediate cancellation of the booking.</p>

<h2>10. Personal Data</h2>
<p>We collect and process your personal data in accordance with our <a href="/legal/privacy">Privacy Policy</a> and the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong.</p>

<h2>11. Liability</h2>
<p>We are not liable for loss of or damage to personal belongings inside the premises. Tenants are encouraged to arrange their own contents insurance.</p>

<h2>12. Governing Law</h2>
<p>These terms are governed by the laws of the Hong Kong Special Administrative Region.</p>

<h2>13. Contact</h2>
<p>For questions about your booking, please email <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>.</p>`

export const DEFAULT_STAY_TERMS_ZH_HK = `<h1>入住條款及細則</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本條款及細則適用於所有 Demain Life @ 1331 之住宿預訂，由 Demain Culture Limited（「我們」）於香港九龍啟德營運。</p>

<h2>一、預訂流程</h2>
<p>預訂須完成以下全部四個步驟方告確認：(a) 提交預訂查詢；(b) 完成個人資料並上載身份證件；(c) 簽署租賃協議；(d) 繳付按金及首期款項。未完成全部四步驟前，不構成任何住宿權利。</p>

<h2>二、住宿</h2>
<p>Demain Life @ 1331 於香港九龍啟德提供共居房間。房型及庫存情況可能更改，確實分配之房型將於簽署租賃協議時確認。</p>

<h2>三、租金及費用</h2>
<p>月租金及適用費用以預訂確認時之報價為準。租金須於每月第一天或之前預付。租金已包括水費、電費（合理使用上限內）及 Wi-Fi，超出部分將另行計算。</p>

<h2>四、按金</h2>
<p>簽署租賃協議時須繳付相當於兩 (2) 個月租金之可退還按金。按金將於租期屆滿後 30 天內退還，惟須扣除任何未付租金、超過合理損耗之損壞或未結算費用。</p>

<h2>五、付款</h2>
<p>我們接受轉數快（FPS）及銀行轉賬，以港幣（HKD）支付。所有轉賬備註必須包含您的預訂參考編號。付款確認截圖須透過付款頁面提交。各階段之付款場景請參閱<a href="/legal/stay-refund">取消及退款政策</a>。</p>

<h2>六、住戶守則</h2>
<p>租客須遵守 Demain Life 住戶守則，包括（但不限於）：(a) 大樓內禁止吸煙；(b) 未經書面同意不得飼養寵物；(c) 安靜時段為晚上 11 時至翌日上午 7 時；(d) 不得進行商業活動；(e) 未經同意不得轉租或分租；(f) 遵守香港所有適用法律。</p>

<h2>七、入住及退房</h2>
<p>入住及退房時間將於租賃協議中確認。提前入住或延遲退房可視乎供應情況安排，可能收取額外費用。</p>

<h2>八、終止</h2>
<p>任何一方可以一個月書面通知終止租約。租客於租期首六個月內提早終止，按金將被沒收，另有書面約定者除外。</p>

<h2>九、身份核實</h2>
<p>我們依法須核實所有租客身份。您須於預訂過程中上載清晰的身份證件照片（香港身份證、護照或中國身份證）。提供虛假或誤導性資料將導致預訂即時取消。</p>

<h2>十、個人資料</h2>
<p>我們依照<a href="/legal/privacy">私隱政策</a>及《個人資料（私隱）條例》（第 486 章）收集及處理您的個人資料。</p>

<h2>十一、責任</h2>
<p>我們對租客存放於單位內之個人財物的遺失或損壞概不負責。建議租客自行購買個人財物保險。</p>

<h2>十二、適用法律</h2>
<p>本條款受香港特別行政區法律管轄。</p>

<h2>十三、聯絡</h2>
<p>如有預訂查詢，請電郵 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>。</p>`

export const DEFAULT_STAY_TERMS_ZH_CN = `<h1>入住条款及细则</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本条款及细则适用于所有 Demain Life @ 1331 之住宿预订，由 Demain Culture Limited（"我们"）于香港九龙启德运营。</p>

<h2>一、预订流程</h2>
<p>预订须完成以下全部四个步骤方告确认：(a) 提交预订咨询；(b) 完成个人资料并上传身份证件；(c) 签署租赁协议；(d) 缴付押金及首期款项。未完成全部四步骤前，不构成任何住宿权利。</p>

<h2>二、住宿</h2>
<p>Demain Life @ 1331 于香港九龙启德提供共居房间。房型及库存情况可能更改，实际分配房型将于签署租赁协议时确认。</p>

<h2>三、租金及费用</h2>
<p>月租金及适用费用以预订确认时之报价为准。租金须于每月第一天或之前预付。租金已包括水费、电费（合理使用上限内）及 Wi-Fi，超出部分将另行计算。</p>

<h2>四、押金</h2>
<p>签署租赁协议时须缴付相当于两 (2) 个月租金之可退还押金。押金将于租期届满后 30 天内退还，但须扣除任何未付租金、超过合理损耗之损坏或未结算费用。</p>

<h2>五、付款</h2>
<p>我们接受转数快（FPS）及银行转账，以港币（HKD）支付。所有转账备注必须包含您的预订参考编号。付款确认截图须透过付款页面提交。各阶段之付款场景请参阅<a href="/legal/stay-refund">取消及退款政策</a>。</p>

<h2>六、住户守则</h2>
<p>租客须遵守 Demain Life 住户守则，包括（但不限于）：(a) 大楼内禁止吸烟；(b) 未经书面同意不得饲养宠物；(c) 安静时段为晚上 11 时至次日上午 7 时；(d) 不得进行商业活动；(e) 未经同意不得转租或分租；(f) 遵守香港所有适用法律。</p>

<h2>七、入住及退房</h2>
<p>入住及退房时间将于租赁协议中确认。提前入住或延迟退房可视供应情况安排，可能收取额外费用。</p>

<h2>八、终止</h2>
<p>任何一方可以一个月书面通知终止租约。租客于租期首六个月内提前终止，押金将被没收，另有书面约定者除外。</p>

<h2>九、身份核实</h2>
<p>我们依法须核实所有租客身份。您须于预订过程中上传清晰的身份证件照片（香港身份证、护照或中国身份证）。提供虚假或误导性信息将导致预订即时取消。</p>

<h2>十、个人信息</h2>
<p>我们依照<a href="/legal/privacy">隐私政策</a>及《个人资料（私隐）条例》（第 486 章）收集及处理您的个人信息。</p>

<h2>十一、责任</h2>
<p>我们对租客存放于单位内之个人财物的遗失或损坏概不负责。建议租客自行购买个人财物保险。</p>

<h2>十二、适用法律</h2>
<p>本条款受香港特别行政区法律管辖。</p>

<h2>十三、联系</h2>
<p>如有预订查询，请邮件 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>。</p>`

// ─── Stay Cancellation & Refund Policy ───────────────────────────────────────

export const DEFAULT_STAY_REFUND_EN = `<h1>Cancellation &amp; Refund Policy — Accommodation</h1>
<p><em>Version 1 · Effective 2026-07-01</em></p>

<p>This policy applies to all accommodation bookings at Demain Life @ 1331, operated by Demain Culture Limited.</p>

<h2>1. Payment Stages</h2>
<p>Accommodation payments proceed in stages:</p>
<ol>
  <li><strong>Stage 1 — Deposit (upon signing):</strong> A security deposit equivalent to two (2) months' rent is due when you sign the tenancy agreement.</li>
  <li><strong>Stage 2 — First month's rent (upon signing):</strong> The first month's rent is due together with the deposit on signing.</li>
  <li><strong>Stage 3 — Ongoing rent:</strong> Monthly rent is due on or before the first day of each calendar month.</li>
</ol>

<h2>2. Cancellation Before Check-in</h2>
<p>If you cancel your booking after signing the tenancy agreement but before the agreed move-in date:</p>
<ul>
  <li><strong>More than 30 days before move-in:</strong> The first month's rent will be refunded. The security deposit is non-refundable as an administration fee.</li>
  <li><strong>14–30 days before move-in:</strong> No refund of the first month's rent. The security deposit is non-refundable.</li>
  <li><strong>Less than 14 days before move-in:</strong> No refund of any payment already made.</li>
</ul>
<p>Cancellations must be made in writing to <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>. The cancellation is effective on the date we receive your written notice.</p>

<h2>3. Early Termination During Tenancy</h2>
<p>If you terminate your tenancy early (before the agreed end date):</p>
<ul>
  <li>Within the first six (6) months of tenancy: the security deposit is forfeited in full.</li>
  <li>After six (6) months: one month's written notice is required. Rent is payable until the notice period expires. The security deposit will be returned within 30 days of the end of tenancy, subject to deductions.</li>
</ul>

<h2>4. Deposit Deductions</h2>
<p>The following may be deducted from the security deposit:</p>
<ul>
  <li>Any unpaid rent or utility charges</li>
  <li>Cost of repairing damage beyond fair wear and tear</li>
  <li>Cleaning costs if the room is not returned in a clean condition</li>
  <li>Any outstanding administration fees</li>
</ul>
<p>We will provide you with an itemised statement of any deductions within 30 days of the end of your tenancy.</p>

<h2>5. Refund Process</h2>
<p>Approved refunds will be processed within <strong>7 business days</strong> of confirmation. Refunds are made by bank transfer to the bank account you provide. We do not refund to third-party accounts.</p>

<h2>6. Cancellation by Demain Life</h2>
<p>In the unlikely event that we must cancel your booking due to circumstances beyond our control, we will give you as much notice as possible and refund all amounts paid in full within 7 business days.</p>

<h2>7. No-Show</h2>
<p>If you do not check in on the agreed move-in date without prior notice, we will attempt to contact you. The booking may be cancelled after 72 hours. No refund will be issued for a no-show.</p>

<h2>8. Contact</h2>
<p>For all cancellation and refund enquiries, please email <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>.</p>`

export const DEFAULT_STAY_REFUND_ZH_HK = `<h1>取消及退款政策 — 住宿</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本政策適用於所有 Demain Life @ 1331 之住宿預訂，由 Demain Culture Limited 營運。</p>

<h2>一、付款階段</h2>
<p>住宿付款分以下階段進行：</p>
<ol>
  <li><strong>第一階段 — 按金（簽約時）：</strong>簽署租賃協議時須繳付相當於兩 (2) 個月租金之按金。</li>
  <li><strong>第二階段 — 首月租金（簽約時）：</strong>首月租金須與按金同時於簽約時繳付。</li>
  <li><strong>第三階段 — 持續租金：</strong>每月租金須於每月第一天或之前繳付。</li>
</ol>

<h2>二、入住前取消</h2>
<p>如您於簽署租賃協議後但入住日期前取消預訂：</p>
<ul>
  <li><strong>入住前逾 30 天：</strong>首月租金將獲退還。按金不予退還，作為行政費用。</li>
  <li><strong>入住前 14–30 天：</strong>首月租金不予退還。按金不予退還。</li>
  <li><strong>入住前少於 14 天：</strong>已付款項一概不予退還。</li>
</ul>
<p>取消須以書面方式電郵至 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>，以我們收到書面通知之日期為準。</p>

<h2>三、租期內提早終止</h2>
<p>如您提早終止租約（於約定終止日期前）：</p>
<ul>
  <li>租期首六 (6) 個月內：按金全數沒收。</li>
  <li>六 (6) 個月後：須提前一個月書面通知，租金須繳至通知期屆滿。按金將於租期結束後 30 天內退還，視扣除情況而定。</li>
</ul>

<h2>四、按金扣除</h2>
<p>以下項目可能從按金中扣除：</p>
<ul>
  <li>任何未付租金或費用</li>
  <li>超過合理損耗之損壞維修費用</li>
  <li>房間未以清潔狀態交還之清潔費用</li>
  <li>任何未付行政費用</li>
</ul>
<p>我們將於租期結束後 30 天內向您提供扣除項目明細。</p>

<h2>五、退款流程</h2>
<p>獲批退款將於確認後 <strong>7 個工作天</strong>內處理，退款至您提供的銀行戶口。我們不退款至第三方賬戶。</p>

<h2>六、Demain Life 取消</h2>
<p>如因不可抗力我們須取消您的預訂，我們將盡早通知您並於 7 個工作天內全額退還已付款項。</p>

<h2>七、未到場</h2>
<p>如您於約定入住日期未出現且未事先通知，我們將嘗試聯絡您。72 小時後預訂可能被取消，未到場概不退款。</p>

<h2>八、聯絡</h2>
<p>所有取消及退款查詢請電郵 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>。</p>`

export const DEFAULT_STAY_REFUND_ZH_CN = `<h1>取消及退款政策 — 住宿</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本政策适用于所有 Demain Life @ 1331 之住宿预订，由 Demain Culture Limited 运营。</p>

<h2>一、付款阶段</h2>
<p>住宿付款分以下阶段进行：</p>
<ol>
  <li><strong>第一阶段 — 押金（签约时）：</strong>签署租赁协议时须缴付相当于两 (2) 个月租金之押金。</li>
  <li><strong>第二阶段 — 首月租金（签约时）：</strong>首月租金须与押金同时于签约时缴付。</li>
  <li><strong>第三阶段 — 持续租金：</strong>每月租金须于每月第一天或之前缴付。</li>
</ol>

<h2>二、入住前取消</h2>
<p>如您于签署租赁协议后但入住日期前取消预订：</p>
<ul>
  <li><strong>入住前逾 30 天：</strong>首月租金将获退还。押金不予退还，作为行政费用。</li>
  <li><strong>入住前 14–30 天：</strong>首月租金不予退还。押金不予退还。</li>
  <li><strong>入住前少于 14 天：</strong>已付款项一概不予退还。</li>
</ul>
<p>取消须以书面方式邮件至 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>，以我们收到书面通知之日期为准。</p>

<h2>三、租期内提前终止</h2>
<p>如您提前终止租约（于约定终止日期前）：</p>
<ul>
  <li>租期首六 (6) 个月内：押金全数没收。</li>
  <li>六 (6) 个月后：须提前一个月书面通知，租金须缴至通知期届满。押金将于租期结束后 30 天内退还，视扣除情况而定。</li>
</ul>

<h2>四、押金扣除</h2>
<p>以下项目可能从押金中扣除：</p>
<ul>
  <li>任何未付租金或费用</li>
  <li>超过合理损耗之损坏维修费用</li>
  <li>房间未以清洁状态交还之清洁费用</li>
  <li>任何未付行政费用</li>
</ul>
<p>我们将于租期结束后 30 天内向您提供扣除项目明细。</p>

<h2>五、退款流程</h2>
<p>获批退款将于确认后 <strong>7 个工作日</strong>内处理，退款至您提供的银行账户。我们不退款至第三方账户。</p>

<h2>六、Demain Life 取消</h2>
<p>如因不可抗力我们须取消您的预订，我们将尽早通知您并于 7 个工作日内全额退还已付款项。</p>

<h2>七、未到场</h2>
<p>如您于约定入住日期未出现且未事先通知，我们将尝试联系您。72 小时后预订可能被取消，未到场概不退款。</p>

<h2>八、联系</h2>
<p>所有取消及退款查询请邮件 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a>。</p>`

// ─── Stay Payment Scenario ────────────────────────────────────────────────────

export const DEFAULT_STAY_PAYMENT_EN = `<h1>Payment Scenario — Accommodation</h1>
<p><em>Version 1 · Effective 2026-07-01</em></p>

<p>This page describes how payments are collected for accommodation bookings at Demain Life @ 1331, operated by Demain Culture Limited.</p>

<h2>1. Who Collects Payment</h2>
<p>All accommodation payments are collected directly by <strong>Demain Culture Limited</strong> (the operator of Demain Life @ 1331), registered in Hong Kong. Payments are made via FPS (Faster Payment System) or bank transfer to the designated account of Demain Culture Limited.</p>

<h2>2. Payment Stages</h2>
<table style="width:100%; border-collapse:collapse; margin:0.8rem 0;">
  <thead><tr style="background:#f4f1ea;">
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Stage</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">When</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Amount</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Method</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">Security deposit</td><td style="padding:8px 12px; border:1px solid #ddd;">On signing tenancy agreement</td><td style="padding:8px 12px; border:1px solid #ddd;">2 months' rent</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / Bank transfer</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">First month's rent</td><td style="padding:8px 12px; border:1px solid #ddd;">On signing tenancy agreement</td><td style="padding:8px 12px; border:1px solid #ddd;">1 month's rent</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / Bank transfer</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">Ongoing monthly rent</td><td style="padding:8px 12px; border:1px solid #ddd;">1st of each calendar month</td><td style="padding:8px 12px; border:1px solid #ddd;">Monthly rent as agreed</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / Bank transfer</td></tr>
  </tbody>
</table>

<h2>3. Payment Method</h2>
<p>We accept:</p>
<ul>
  <li><strong>FPS (Faster Payment System)</strong> — Send to FPS ID: <strong>115403669</strong> (Demain Culture Limited). Scan the QR code on the payment page.</li>
  <li><strong>Bank transfer</strong> — ZA Bank, Account: 882002273557, Account name: Demain Culture Limited.</li>
</ul>
<p>All payments must be made in Hong Kong Dollars (HKD). Please include your booking reference number in the transfer note/remark.</p>

<h2>4. Payment Confirmation</h2>
<p>After making a payment, you must submit a screenshot of the successful transfer through your payment page. Our team will verify the payment within one business day and send you a confirmation email.</p>

<h2>5. Receipts</h2>
<p>A payment receipt will be emailed to you after each payment is verified. Please retain all receipts for your records.</p>

<h2>6. Late Payment</h2>
<p>Rent is due on or before the first day of each calendar month. Late payments may incur a charge equivalent to 5% of the outstanding amount per month.</p>

<h2>7. Refunds</h2>
<p>Please refer to our <a href="/legal/stay-refund">Cancellation &amp; Refund Policy</a> for details on refund eligibility and timelines.</p>

<h2>8. Data Security</h2>
<p>We do not store credit card details. All payment information (FPS/bank transfer details and payment screenshots) is handled in accordance with our <a href="/legal/privacy">Privacy Policy</a>.</p>

<h2>9. Contact</h2>
<p>For payment enquiries, please email <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a> or WhatsApp us at the number on our website.</p>`

export const DEFAULT_STAY_PAYMENT_ZH_HK = `<h1>付款場景 — 住宿</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本頁說明 Demain Life @ 1331 住宿預訂之付款收取方式，由 Demain Culture Limited 負責營運。</p>

<h2>一、付款收取方</h2>
<p>所有住宿款項均由 <strong>Demain Culture Limited</strong>（Demain Life @ 1331 之營運商，在香港登記）直接收取，以轉數快（FPS）或銀行轉賬方式支付至 Demain Culture Limited 指定賬戶。</p>

<h2>二、付款階段</h2>
<table style="width:100%; border-collapse:collapse; margin:0.8rem 0;">
  <thead><tr style="background:#f4f1ea;">
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">階段</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">時間</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">金額</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">方式</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">按金</td><td style="padding:8px 12px; border:1px solid #ddd;">簽署租賃協議時</td><td style="padding:8px 12px; border:1px solid #ddd;">兩個月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / 銀行轉賬</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">首月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">簽署租賃協議時</td><td style="padding:8px 12px; border:1px solid #ddd;">一個月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / 銀行轉賬</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">持續月租</td><td style="padding:8px 12px; border:1px solid #ddd;">每月第一天</td><td style="padding:8px 12px; border:1px solid #ddd;">按協議月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / 銀行轉賬</td></tr>
  </tbody>
</table>

<h2>三、付款方式</h2>
<p>我們接受：</p>
<ul>
  <li><strong>轉數快（FPS）</strong>——轉賬至 FPS ID：<strong>115403669</strong>（Demain Culture Limited）。可掃描付款頁面上的二維碼。</li>
  <li><strong>銀行轉賬</strong>——ZA Bank，賬號：882002273557，賬戶名：Demain Culture Limited。</li>
</ul>
<p>所有款項須以港幣（HKD）支付。請在轉賬備註中填寫您的預訂參考編號。</p>

<h2>四、付款確認</h2>
<p>付款後請透過付款頁面上載成功轉賬的截圖。我們的團隊將於一個工作天內核對，並向您發送確認電郵。</p>

<h2>五、收據</h2>
<p>每筆付款核對完成後將以電郵發送收據，請妥善保存。</p>

<h2>六、逾期付款</h2>
<p>租金須於每月第一天或之前繳付。逾期付款可能須繳付相當於未付金額每月 5% 之滯納金。</p>

<h2>七、退款</h2>
<p>退款資格及時間表請參閱<a href="/legal/stay-refund">取消及退款政策</a>。</p>

<h2>八、資料安全</h2>
<p>我們不儲存信用卡資料。所有付款資料（FPS／銀行轉賬資料及截圖）依照<a href="/legal/privacy">私隱政策</a>處理。</p>

<h2>九、聯絡</h2>
<p>付款查詢請電郵 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a> 或透過網站上之 WhatsApp 聯絡我們。</p>`

export const DEFAULT_STAY_PAYMENT_ZH_CN = `<h1>付款场景 — 住宿</h1>
<p><em>版本 1 · 2026-07-01 生效</em></p>

<p>本页说明 Demain Life @ 1331 住宿预订之付款收取方式，由 Demain Culture Limited 负责运营。</p>

<h2>一、付款收取方</h2>
<p>所有住宿款项均由 <strong>Demain Culture Limited</strong>（Demain Life @ 1331 之运营商，在香港登记）直接收取，以转数快（FPS）或银行转账方式支付至 Demain Culture Limited 指定账户。</p>

<h2>二、付款阶段</h2>
<table style="width:100%; border-collapse:collapse; margin:0.8rem 0;">
  <thead><tr style="background:#f4f1ea;">
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">阶段</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">时间</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">金额</th>
    <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">方式</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">押金</td><td style="padding:8px 12px; border:1px solid #ddd;">签署租赁协议时</td><td style="padding:8px 12px; border:1px solid #ddd;">两个月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / 银行转账</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">首月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">签署租赁协议时</td><td style="padding:8px 12px; border:1px solid #ddd;">一个月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / 银行转账</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd;">持续月租</td><td style="padding:8px 12px; border:1px solid #ddd;">每月第一天</td><td style="padding:8px 12px; border:1px solid #ddd;">按协议月租金</td><td style="padding:8px 12px; border:1px solid #ddd;">FPS / 银行转账</td></tr>
  </tbody>
</table>

<h2>三、付款方式</h2>
<p>我们接受：</p>
<ul>
  <li><strong>转数快（FPS）</strong>——转账至 FPS ID：<strong>115403669</strong>（Demain Culture Limited）。可扫描付款页面上的二维码。</li>
  <li><strong>银行转账</strong>——ZA Bank，账号：882002273557，账户名：Demain Culture Limited。</li>
</ul>
<p>所有款项须以港币（HKD）支付。请在转账备注中填写您的预订参考编号。</p>

<h2>四、付款确认</h2>
<p>付款后请透过付款页面上传成功转账的截图。我们的团队将于一个工作日内核对，并向您发送确认邮件。</p>

<h2>五、收据</h2>
<p>每笔付款核对完成后将以邮件发送收据，请妥善保存。</p>

<h2>六、逾期付款</h2>
<p>租金须于每月第一天或之前缴付。逾期付款可能须缴付相当于未付金额每月 5% 之滞纳金。</p>

<h2>七、退款</h2>
<p>退款资格及时间表请参阅<a href="/legal/stay-refund">取消及退款政策</a>。</p>

<h2>八、资料安全</h2>
<p>我们不储存信用卡资料。所有付款资料（FPS／银行转账资料及截图）依照<a href="/legal/privacy">隐私政策</a>处理。</p>

<h2>九、联系</h2>
<p>付款查询请邮件 <a href="mailto:bookings@demainlife.com">bookings@demainlife.com</a> 或通过网站上之 WhatsApp 联系我们。</p>`

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
  'shop-terms': {
    en: DEFAULT_SHOP_TERMS_EN,
    'zh-HK': DEFAULT_SHOP_TERMS_ZH_HK,
    'zh-CN': DEFAULT_SHOP_TERMS_ZH_CN
  },
  refund: {
    en: DEFAULT_REFUND_EN,
    'zh-HK': DEFAULT_REFUND_ZH_HK,
    'zh-CN': DEFAULT_REFUND_ZH_CN
  },
  shipping: {
    en: DEFAULT_SHIPPING_EN,
    'zh-HK': DEFAULT_SHIPPING_ZH_HK,
    'zh-CN': DEFAULT_SHIPPING_ZH_CN
  },
  privacy: {
    en: DEFAULT_PRIVACY_EN,
    'zh-HK': DEFAULT_PRIVACY_ZH_HK,
    'zh-CN': DEFAULT_PRIVACY_ZH_CN
  },
  'stay-terms': {
    en: DEFAULT_STAY_TERMS_EN,
    'zh-HK': DEFAULT_STAY_TERMS_ZH_HK,
    'zh-CN': DEFAULT_STAY_TERMS_ZH_CN
  },
  'stay-refund': {
    en: DEFAULT_STAY_REFUND_EN,
    'zh-HK': DEFAULT_STAY_REFUND_ZH_HK,
    'zh-CN': DEFAULT_STAY_REFUND_ZH_CN
  },
  'stay-payment': {
    en: DEFAULT_STAY_PAYMENT_EN,
    'zh-HK': DEFAULT_STAY_PAYMENT_ZH_HK,
    'zh-CN': DEFAULT_STAY_PAYMENT_ZH_CN
  },
  disclaimer: {
    en: `<h1>Disclaimer</h1>
<p><em>Last updated: August 2026</em></p>
<h2>Accuracy of Information</h2>
<p>The information on this website is provided for general reference only. Demain Culture Entertainment Limited reserves the right to modify room rates, policies, and facility details at any time without prior notice.</p>
<h2>No Warranty</h2>
<p>This website is provided "as is" without any representations or warranties, express or implied. We make no representations or warranties in relation to the accuracy or completeness of the information found on this website.</p>
<h2>External Links</h2>
<p>This website may contain links to external websites. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.</p>
<h2>Payment Security</h2>
<p>All online payments are encrypted and processed by QFPay. Demain Culture Entertainment Limited does not store any credit card or payment card data.</p>
<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by Hong Kong law, Demain Culture Entertainment Limited shall not be liable for any indirect, special, or consequential loss or damage arising from the use of this website or our services.</p>
<h2>Governing Law</h2>
<p>This disclaimer is governed by the laws of the Hong Kong Special Administrative Region. Any disputes shall be subject to the exclusive jurisdiction of the Hong Kong courts.</p>
<h2>Contact</h2>
<p>Demain Culture Entertainment Limited<br>Suites 1218-19, 12/F, Chevalier Commercial Centre, 8 Wang Hoi Road, Kowloon Bay, Hong Kong<br>Tel: +852 2129 0190 · Email: hello@demainculture.com</p>`,
    'zh-HK': `<h1>免責聲明</h1>
<p><em>最後更新：2026年8月</em></p>
<h2>資訊準確性</h2>
<p>本網站所載資訊僅供一般參考之用。Demain Culture Entertainment Limited 保留隨時修改房租、政策及設施資訊之權利，恕不另行通知。</p>
<h2>無保證聲明</h2>
<p>本網站以「現狀」提供，不作任何明示或默示之陳述或保證。我們對本網站所載資訊之準確性或完整性不作任何陳述或保證。</p>
<h2>外部連結</h2>
<p>本網站可能包含外部網站之連結。我們對該等網站之內容無法控制，並對因使用該等網站而引起之任何損失或損害概不負責。</p>
<h2>支付安全</h2>
<p>所有線上付款均由 QFPay 加密處理。Demain Culture Entertainment Limited 不儲存任何信用卡或付款卡資料。</p>
<h2>責任限制</h2>
<p>在香港法律允許的最大範圍內，Demain Culture Entertainment Limited 對因使用本網站或我們的服務而引起的任何間接、特殊或後果性損失或損害概不負責。</p>
<h2>適用法律</h2>
<p>本免責聲明受香港特別行政區法律管轄，任何爭議由香港法院專屬管轄。</p>
<h2>聯絡方式</h2>
<p>Demain Culture Entertainment Limited<br>香港九龍灣宏開道8號其士商業中心12樓1218-19室<br>電話：+852 2129 0190 · 電郵：hello@demainculture.com</p>`,
    'zh-CN': `<h1>免责声明</h1>
<p><em>最后更新：2026年8月</em></p>
<h2>信息准确性</h2>
<p>本网站所载信息仅供一般参考之用。Demain Culture Entertainment Limited 保留随时修改房租、政策及设施信息之权利，恕不另行通知。</p>
<h2>无保证声明</h2>
<p>本网站以「现状」提供，不作任何明示或默示之陈述或保证。我们对本网站所载信息之准确性或完整性不作任何陈述或保证。</p>
<h2>外部链接</h2>
<p>本网站可能包含外部网站之链接。我们对该等网站之内容无法控制，并对因使用该等网站而引起之任何损失或损害概不负责。</p>
<h2>支付安全</h2>
<p>所有线上付款均由 QFPay 加密处理。Demain Culture Entertainment Limited 不存储任何信用卡或付款卡资料。</p>
<h2>责任限制</h2>
<p>在香港法律允许的最大范围内，Demain Culture Entertainment Limited 对因使用本网站或我们的服务而引起的任何间接、特殊或后果性损失或损害概不负责。</p>
<h2>适用法律</h2>
<p>本免责声明受香港特别行政区法律管辖，任何争议由香港法院专属管辖。</p>
<h2>联系方式</h2>
<p>Demain Culture Entertainment Limited<br>香港九龙湾宏开道8号其士商业中心12楼1218-19室<br>电话：+852 2129 0190 · 邮箱：hello@demainculture.com</p>`
  },
  // Default landlord info — editable in admin
  landlord: {
    name: 'Demain Culture Entertainment Limited',
    address: 'Suites 1218-19, 12/F, Chevalier Commercial Centre, 8 Wang Hoi Road, Kowloon Bay, Hong Kong',
    representative: 'Tat Lam',
    bankName: 'ZA Bank',
    bankAccountNumber: '882002273557',
    bankAccountName: 'Demain Culture Entertainment Limited',
    fpsId: '115403669',
    fpsQrUrl: '/payment/fps-qr.jpg'
  }
}
