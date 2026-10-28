<blockquote data-no-copy><p>本篇是進階安裝，預設你已經裝好 VS Code 和 Codex 插件。還沒裝的請先看<a href="/blog/codex-windows-wsl-install/">上集：VS Code + Codex 插件版</a>——日常使用其實插件版就夠，確定需要終端機和自動化再回來。</p>
</blockquote>
<h2 id="這一篇要裝什麼cli-為主wsl2-選用">這一篇要裝什麼：CLI 為主，WSL2 選用</h2>
<ul>
<li>主要工具｜Codex CLI：在終端機用打字的方式操作 Codex</li>
<li>選用工具｜WSL2：Windows 裡的 Linux 工作區，遇到偏向 Linux 的專案再裝</li>
</ul>
<p>如果安裝中途失敗，可以把這篇文章的連結與終端機顯示的完整錯誤原文一起貼給 AI：</p>
<pre data-code-kind="output"><code>https://aixwang.dev/blog/codex-cli-wsl2-windows/
</code></pre>
<p>複製終端機的錯誤訊息和平常複製文字不太一樣：</p>
<ol>
<li>先用滑鼠把完整錯誤訊息反白。</li>
<li>在反白的文字上按滑鼠右鍵複製。</li>
<li>回到 Codex 的訊息輸入框，再按滑鼠右鍵貼上。</li>
</ol>
<p>不要直接在終端機按 <code>Ctrl+C</code>。在許多終端機裡，<code>Ctrl+C</code> 的用途是停止目前正在執行的指令，不是複製文字。</p>
<p>請保留錯誤訊息原文，不要只描述「安裝失敗」。AI 才能對照本文的安裝環境、指令與實測畫面，判斷你卡在哪一步。</p>
<h2 id="第一步請-codex-插件用自然語言安裝-codex-cli">第一步：請 Codex 插件用自然語言安裝 Codex CLI</h2>
<p>不需要自己複製一長串 PowerShell 指令。回到 VS Code 右側的 Codex 插件，直接貼上下面這段話：</p>
<pre data-code-kind="prompt" data-code-label="提示詞"><code class="language-prompt">請幫我在這台 Windows 電腦安裝最新版 Codex CLI。
請實際執行安裝、設定目前使用者的 PATH，並用 codex --version 確認安裝結果。
完成後，我要能在重新開啟的 PowerShell、Windows Terminal 或 VS Code 終端機中，
進入任何專案資料夾並輸入 codex 啟動。
如果途中出現錯誤，請讀取完整錯誤訊息並繼續排除。
</code></pre>
<p>Codex 準備執行安裝指令時，畫面可能會要求你確認權限。先看清楚它準備執行的內容，再按下允許。接著等待 Codex 完成安裝、設定 PATH，並顯示 <code>codex --version</code> 的驗證結果。</p>
<p>安裝完成後：</p>
<ol>
<li>完全關閉所有 VS Code、PowerShell 與 Windows Terminal 視窗。</li>
<li>重新開啟 VS Code 與剛才的專案資料夾。</li>
<li>選擇 <strong>終端機（Terminal）→ 新增終端機（New Terminal）</strong>。</li>
<li>輸入 <code>codex</code>，確認 CLI 能正常開啟。</li>
</ol>
<p>這項安裝只需要完成一次。未來可以在任何專案資料夾使用 VS Code、Cursor、Antigravity、PowerShell、CMD 或其他終端工具，輸入 <code>codex</code> 啟動，不限定只能在 VS Code 裡使用。</p>
<details>
<summary><strong>補充：為什麼我安裝的是隔離版？</strong></summary><p><code>Codex-Isolated</code> 是本文自訂的資料夾名稱，不是 OpenAI 另外推出的 Codex 版本。為了不覆蓋電腦原有版本，本次實測刻意將執行檔與 <code>CODEX_HOME</code> 分開，讓測試用的登入資料、設定、記錄與工作階段不和原本的 Codex 共用。</p><p>第一次只需要安裝一套 CLI 的新手，直接請插件依官方預設方式安裝即可，不需要指定 <code>Codex-Isolated</code>，也不要照抄本次實測的特殊路徑。</p><p>隔離安裝不代表 Codex 看不到專案。只要檔案位於目前開啟且允許操作的專案資料夾，Codex 仍可讀取其中的文章草稿、安裝紀錄與其他專案檔案。不要把密碼、API 金鑰或其他不希望 AI 讀取的私人資料放進專案資料夾。</p><p>本次安裝器辨識為 <code>Windows (x64)</code>，並成功安裝 Codex CLI <code>0.145.0</code>：</p><img src="/images/blog/codex-windows-wsl-install/09-codex-windows-isolated-install.png" alt="Codex 在 Windows PowerShell 實際安裝並驗證 Codex CLI"><p>本次實測使用的 CLI 路徑是：</p><pre data-code-kind="default"><code>C:\Users\你的帳號\AppData\Local\Programs\OpenAI\Codex-Isolated\bin\codex.exe</code></pre></details><details>
<summary><strong>如果輸入 codex 出現 CommandNotFoundException，點此查看實測錯誤</strong></summary><pre data-code-kind="default"><code>codex : 無法辨識 'codex' 詞彙是否為 Cmdlet、函數、指令檔或可執行程式的名稱。
請檢查名稱拼字是否正確，如果包含路徑的話，請確認路徑是否正確，然後再試一次。
位於 線路:1 字元:1
+ codex
+ ~~~~~
    + CategoryInfo          : ObjectNotFound: (codex:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException</code></pre><img src="/images/blog/codex-windows-wsl-install/06-vscode-codex-installed-cli-not-found.png" alt="尚未安裝 Codex CLI 時，Windows PowerShell 輸入 codex 的實機結果"><p>這個錯誤代表當時 CLI 尚未安裝，或目前開啟的視窗尚未讀取新的 PATH。請把完整錯誤原文貼回 Codex，請它繼續檢查；如果剛完成安裝，也要先完全關閉並重新開啟 VS Code 與終端機。</p>
</details><h2 id="第二步安裝後確認現在開啟的是不是剛裝好的-codex">第二步：安裝後確認——現在開啟的是不是剛裝好的 Codex？</h2>
<p>看到「安裝成功」後，還要做一次簡單確認：</p>
<ol>
<li>完全關閉並重新開啟 VS Code 與終端機。</li>
<li>用 VS Code 開啟剛才的專案資料夾。</li>
<li>新增終端機並輸入：</li>
</ol>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-bash">codex --version
</code></pre>
<p>畫面會顯示目前真正開啟的 Codex 版本。如果版本和剛才安裝完成時顯示的一樣，就可以繼續使用。</p>
<p>如果顯示的數字反而比較舊，通常不是安裝失敗，而是電腦裡原本就有另一份 Codex。可以把它想成電腦裡有兩扇都寫著「Codex」的門；你雖然裝好新的那一份，電腦卻先打開了舊的門。</p>
<p>這時不需要自己研究 PATH，也不要急著刪除 Node.js、WSL 或其他工具。把下面這段話貼給 Codex 插件：</p>
<pre data-code-kind="prompt" data-code-label="提示詞"><code class="language-prompt">我已經安裝 Codex CLI，但 codex --version 顯示的不是剛安裝的版本。
請幫我確認電腦裡是否有多份 Codex、目前實際開啟的是哪一份，
並在不要刪除 Node.js、WSL 或其他工具的前提下修正。
完成後請重新執行 codex --version 驗證。
</code></pre>
<details>
<summary><strong>查看本次遇到兩份 Codex 的實測紀錄</strong></summary><p>本次測試電腦原本有 Codex CLI <code>0.144.6</code>，後來又隔離安裝了 <code>0.145.0</code>。直接輸入 <code>codex</code> 時，電腦仍先開啟原有的舊版本：</p><img src="/images/blog/codex-windows-wsl-install/04-codex-version-check.png" alt="兩份 Codex CLI 造成實際開啟版本不同"><pre data-code-kind="default"><code>安裝器下載的新版本：0.145.0
直接輸入 codex：0.144.6
原因：電腦先找到原本的版本</code></pre><p>排查時實際使用的技術指令如下。新手不需要先理解，可以交給 Codex 執行：</p><pre data-code-kind="default"><code>type -a codex
which codex
codex --version</code></pre>
</details><h2 id="第三步以後怎麼開啟-codex-cli">第三步：以後怎麼開啟 Codex CLI？</h2>
<p>Codex CLI 只需要安裝一次，不必每次開新專案都重新安裝。</p>
<p>最適合新手的開啟方式：</p>
<ol>
<li>開啟 VS Code。</li>
<li>選擇 <strong>檔案（File）→ 開啟資料夾（Open Folder...）</strong>。</li>
<li>選擇想讓 Codex 操作的專案資料夾。</li>
<li>選擇 <strong>終端機（Terminal）→ 新增終端機（New Terminal）</strong>。</li>
<li>在下方終端機輸入：</li>
</ol>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-bash">codex
</code></pre>
<p>按下 Enter 後，終端機會開啟 Codex CLI：</p>
<p><img src="/images/blog/codex-windows-wsl-install/13-vscode-terminal-start-codex-cli.png" alt="在 VS Code 下方終端機輸入 codex，成功開啟 Codex CLI"></p>
<p>如果畫面要求登入，依照提示使用 ChatGPT 帳號登入。CLI 與 IDE 插件在同一個執行環境下可以共用 Codex 設定與登入資料；若一個安裝在 Windows、另一個安裝在 WSL，則可能各自使用不同的 home 目錄。</p>
<p>VS Code 會自動讓新終端機位於剛開啟的專案資料夾，不需要先輸入 <code>cd</code>。Codex 會以這個資料夾作為工作位置，讀取並修改該專案。</p>
<p>像請 Codex 安裝並執行一個 GitHub 開源專案這類，需要連續讀取說明、執行安裝指令、查看結果與排除錯誤的工作，使用 CLI 通常比插件版少切換視窗，也不必一直搬運終端機訊息，操作會順暢許多。</p>
<h3 id="選用把-cli-權限改成-bypass">選用：把 CLI 權限改成 Bypass</h3>
<p>如果不想在 CLI 執行每個步驟時都手動同意，可以在 CLI 的權限選項中改成 <strong>Bypass</strong>。這會略過執行前的確認與沙盒限制，讓安裝流程更連續，但也代表 Codex 能直接執行更多電腦操作。</p>
<p>在已開啟的 Codex CLI 中操作：</p>
<ol>
<li>點一下畫面下方的訊息輸入框。</li>
<li>輸入 <code>/permissions</code>，再按 Enter。</li>
<li>使用方向鍵選擇 <strong>Bypass approvals and sandbox</strong>；部分版本可能只顯示 <strong>Bypass</strong>。</li>
<li>按 Enter 套用。</li>
<li>輸入 <code>/status</code>，確認目前使用的核准與沙盒設定。</li>
</ol>
<p>如果權限選單沒有 Bypass，可以先輸入 <code>/quit</code> 離開 CLI，再回到終端機輸入：</p>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-powershell">codex --yolo
</code></pre>
<p><code>--yolo</code> 是 <code>--dangerously-bypass-approvals-and-sandbox</code> 的簡寫，兩者都會讓 Codex 不經確認執行指令，並關閉沙盒限制。</p>
<p>只應在獨立的測試環境、沒有私人資料且可以重新建立的專案中使用 Bypass。專案或電腦中若有私人文件、密碼、API 金鑰或重要檔案，請維持預設權限，不要開啟這個模式。</p>
<p>官方說明：<a href="https://learn.chatgpt.com/docs/agent-approvals-security">Codex CLI 權限與沙盒</a>、<a href="https://learn.chatgpt.com/docs/cli/reference">Codex CLI 指令參數</a>。</p>
<p>如果已經熟悉終端機，也可以使用：</p>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-bash">cd 你的專案資料夾
codex
</code></pre>
<p>這個操作不限定要在 VS Code 裡完成。只要該終端機找得到 <code>codex</code> 指令，就可以使用：</p>
<ul>
<li>VS Code 的整合終端機；</li>
<li>Cursor、Antigravity 或其他 IDE 的終端機；</li>
<li>Windows Terminal；</li>
<li>PowerShell；</li>
<li>Windows 命令提示字元（CMD）；</li>
<li>WSL 的 Ubuntu 終端機；</li>
<li>單獨開啟的其他終端工具。</li>
</ul>
<p>要注意的是：CLI 安裝在哪個環境，就從哪個環境啟動。Windows 安裝的 CLI 從 Windows 終端機使用；WSL 安裝的 CLI 從 WSL 終端機使用，不要把兩邊的路徑混在一起。</p>
<h2 id="選用在-wsl2-安裝-codex-cli">選用：在 WSL2 安裝 Codex CLI</h2>
<p>前面的 Windows 安裝、確認與登入都完成後，再決定是否需要 WSL2。只使用 Windows 的讀者可以直接跳過這一步。</p>
<p>以系統管理員身分開啟 PowerShell：</p>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-powershell">wsl --install
</code></pre>
<p>重新開機、完成 Ubuntu 使用者設定後，執行：</p>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-powershell">wsl --list --verbose
</code></pre>
<p><code>VERSION</code> 必須是 <code>2</code>。如果顯示 <code>1</code>，代表你使用的是較舊的 WSL，不能直接跟著本文繼續。</p>
<p>接著從 Ubuntu 終端機建立專案目錄：</p>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-bash">mkdir -p ~/code
cd ~/code
code .
</code></pre>
<p>VS Code 左下角應顯示 <code>WSL: Ubuntu</code>，整合終端機的路徑應是 <code>/home/...</code>，而不是 <code>C:\...</code>。</p>
<p>不要把專案放在 <code>/mnt/c/...</code>。那相當於讓 WSL 隔著一扇門一直讀取 Windows 裡的檔案，安裝可能比較慢，也容易遇到檔案無法修改的問題。</p>
<p>OpenAI 目前提供獨立安裝腳本。在 WSL 的 Ubuntu 終端機執行：</p>
<pre data-code-kind="terminal" data-code-label="終端機"><code class="language-bash">curl -fsSL https://chatgpt.com/codex/install.sh | sh
</code></pre>
<p>本次為了不覆蓋正在使用的 Codex，我將 <code>CODEX_HOME</code> 與 <code>CODEX_INSTALL_DIR</code> 指向 <code>/tmp/codex-article-20260724/</code> 的隔離位置，並設定 <code>CODEX_NON_INTERACTIVE=1</code> 重跑官方安裝器。實際下載並安裝出 <code>0.145.0</code>。安裝器正確辨識：</p>
<ul>
<li>作業系統為 Linux x64；</li>
<li>最新版本為 0.145.0；</li>
<li>電腦上已存在 npm 管理的 Codex；</li>
<li>同時存在多份 Codex 時，PATH 順序會決定實際執行哪一份。</li>
</ul>
<p><img src="/images/blog/codex-windows-wsl-install/03-codex-clean-install.png" alt="Codex CLI 官方安裝腳本的實際輸出"></p>
<p>這次隔離測試保留了兩段英文警告原文。第一段表示電腦上已經有另一份 npm 管理的 Codex：</p>
<pre data-code-kind="output"><code>WARNING: Multiple managed Codex installs can be ambiguous because PATH order decides which one runs.
</code></pre>
<p>第二段是正常安裝較少遇到的警告：</p>
<pre data-code-kind="output"><code>WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir &quot;/tmp&quot; (codex_home: AbsolutePathBuf(&quot;/tmp/codex-article-20260724/home&quot;))
</code></pre>
<p>這不是下載失敗。原因是本次刻意把安裝位置放在 <code>/tmp</code>，安裝器拒絕在暫存目錄建立長期 PATH helper；最後仍明確顯示 <code>Codex CLI 0.145.0 installed successfully.</code>。一般使用者採用預設安裝位置時，不應照抄本次隔離路徑。</p>
<h2 id="官方參考資料">官方參考資料</h2>
<ul>
<li><a href="https://learn.chatgpt.com/docs/codex/cli">OpenAI：Codex CLI</a></li>
<li><a href="https://learn.chatgpt.com/docs/codex/ide">OpenAI：Codex IDE 插件</a></li>
<li><a href="https://learn.chatgpt.com/docs/windows/wsl">OpenAI：Codex on WSL</a></li>
<li><a href="https://learn.chatgpt.com/docs/windows/windows-sandbox">OpenAI：Codex Windows sandbox</a></li>
<li><a href="https://code.visualstudio.com/docs/remote/wsl-tutorial">Visual Studio Code：WSL 教學</a></li>
</ul>
<h2 id="附錄這次實測的環境">附錄：這次實測的環境</h2>
<p>本次實測環境如下：</p>
<ul>
<li>WSL2 Ubuntu 24.04</li>
<li>VS Code 1.130.0</li>
<li>Node.js 24.11.0</li>
<li>npm 11.6.1</li>
<li>Windows PowerShell 5.1 隔離安裝：Codex CLI 0.145.0</li>
<li>已存在的 Codex CLI：0.144.6</li>
<li>乾淨隔離安裝取得的 Codex CLI：0.145.0</li>
<li>VS Code 官方插件：<code>openai.chatgpt@26.721.30844</code></li>
</ul>
<p><img src="/images/blog/codex-windows-wsl-install/01-wsl-environment.png" alt="WSL2、VS Code、Node 與 npm 版本的實際終端紀錄"></p>
<p>這一段留給排錯時核對用，新手不需要先理解每個名稱。版本會持續更新，也不必要求你的數字與本文完全相同；只要指令能正常顯示版本即可。</p>
<h2 id="裝好之後可以做什麼">裝好之後可以做什麼</h2>
<p>到這裡你已經有完整的 Codex 環境：VS Code 裡用插件、終端機裡用 CLI，之後要接自動發文、排程腳本都是在這個基礎上疊加。</p>
<p>WSL2 或 CLI 安裝噴錯了？加 LINE 把畫面截圖傳給我，簡單問題<strong>免費</strong>幫你排。</p>
<p>我平常的工作是全職接案做客製系統開發，代表案例是<a href="/blog/math-teacher-question-bank/">補習班數學題庫系統</a>；想把手上重複的工作做成系統，可以看<a href="https://service.aixwang.dev/services/development/">客製系統開發服務</a>。</p>
