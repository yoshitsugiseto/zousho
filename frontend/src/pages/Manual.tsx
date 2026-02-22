import { BookOpen, KeyRound, Smartphone, LibraryBig, PlusCircle, Settings, Users } from 'lucide-react'

export function Manual() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="bg-white px-8 py-10 shadow-sm rounded-lg border border-gray-100 mb-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    蔵書管理システム 使い方マニュアル
                </h1>
                <p className="mt-4 text-lg text-gray-600 block">
                    日々の業務での蔵書の借り方・返し方や、初期設定の方法をご案内します。
                </p>
            </div>

            {/* 1. はじめての方へ（初期設定） */}
            <section className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
                    <KeyRound className="w-6 h-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">1. はじめての方へ（初期設定と2段階認証）</h2>
                </div>
                <div className="p-6 text-gray-700 space-y-6">
                    <p>
                        管理者から「招待メール」を受け取ったら、以下の手順で初期設定を行います。当システムではセキュリティを確保するため、<strong>2段階認証（スマートフォン等を使ったコード認証）</strong>が必須となっています。
                    </p>

                    <div className="ml-4 space-y-4">
                        <div className="flex border-l-4 border-blue-500 pl-4">
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold mr-4 mb-auto mt-0.5">1</div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">招待メールのリンクを開く</h3>
                                <p className="text-sm">届いたメール内の「招待を受け入れて設定を開始する」をクリックすると、パスワード設定画面が開きます。</p>
                            </div>
                        </div>
                        <div className="flex border-l-4 border-blue-500 pl-4">
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold mr-4 mb-auto mt-0.5">2</div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">パスワードを決める</h3>
                                <p className="text-sm">今後ログインに使用するお好きなパスワード（6文字以上）を入力し、「パスワードを登録して次へ」を押します。</p>
                            </div>
                        </div>
                        <div className="flex border-l-4 border-blue-500 pl-4">
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold mr-4 mb-auto mt-0.5">3</div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">2段階認証アプリの準備（Google Authenticatorなど）</h3>
                                <p className="text-sm">スマートフォンで「Google Authenticator」等の認証アプリを開き、「QRコードをスキャン」を選択して画面のQRコードを読み取ります。</p>
                            </div>
                        </div>
                        <div className="flex border-l-4 border-blue-500 pl-4">
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold mr-4 mb-auto mt-0.5">4</div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">6桁のコードを入力して設定完了</h3>
                                <p className="text-sm">スマホ画面に表示された6桁の数字をパソコン側に入力し、「設定を完了する」を押すとダッシュボードが表示されます。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. 普段のログイン方法 */}
            <section className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
                    <Smartphone className="w-6 h-6 text-indigo-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">2. 普段のログインに関する操作</h2>
                </div>
                <div className="p-6 text-gray-700 space-y-4">
                    <p>
                        設定完了後のログイン手順は以下の通りです。
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>ログイン画面で<strong>メールアドレス</strong>と<strong>パスワード</strong>を入力して「ログイン」ボタンを押します。</li>
                        <li>次の画面で、スマートフォンの認証アプリに表示されている<strong>6桁のコード</strong>を入力し、「認証する」を選択します。これでログイン完了です。</li>
                    </ul>
                </div>
            </section>

            {/* 3. 本の借り方・返し方 */}
            <section className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
                    <BookOpen className="w-6 h-6 text-green-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">3. 本の借り方・返し方</h2>
                </div>
                <div className="p-6 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                        <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                            <LibraryBig className="w-5 h-5 mr-2" /> 本を借りる場合
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2 text-sm text-green-900">
                            <li>画面上部のナビゲーションから「ダッシュボード」を開きます。</li>
                            <li>「みんなの本棚」から借りたい本を探します。タイトルや著者名で検索できます。</li>
                            <li>「在庫あり」と表示されている本の<strong>「本を借りる」ボタン</strong>をクリックします。</li>
                            <li>ボタンが「返却は管理者へ」に変われば貸出完了です。同時に「あなたの読書状況」が自動で「読書中」に変わります。</li>
                        </ol>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                            <KeyRound className="w-5 h-5 mr-2 opacity-0" /> 本を返す場合
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                            <li><strong>本システムでは、ユーザー自身の手によるアプリ上での返却操作はできません。</strong></li>
                            <li>読み終わった実際の本は、オフィス等の所定の場所（または担当者・管理者）へお戻しください。</li>
                            <li>システム上の在庫返却処理については、<strong>管理者側（書籍管理メニュー）で実施されます。</strong></li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 4. 管理者向け機能 */}
            <section className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
                    <Settings className="w-6 h-6 text-gray-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">4. 管理者向けマニュアル（管理者のみ）</h2>
                </div>
                <div className="p-6 text-gray-700">
                    <p className="mb-4 text-sm text-gray-500">※この項目は一般ユーザーの方には表示されないメニューについての説明です。</p>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-md font-bold text-gray-800 flex items-center border-b pb-2 mb-2">
                                <PlusCircle className="w-4 h-4 mr-2" /> 書籍の追加・管理
                            </h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>「書籍管理」メニューから、新しい本の登録が可能です。</li>
                                <li>「ISBNから情報取得して登録」を選ぶと、13桁のISBN（バーコードの番号）を入力するだけでタイトルや表紙画像を自動で取得し、手軽に登録できます。</li>
                                <li>「手動で登録」から、既存の本の情報修正や表紙画像のアップロード、削除を行うことができます。</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-md font-bold text-gray-800 flex items-center border-b pb-2 mb-2">
                                <Users className="w-4 h-4 mr-2" /> ユーザーの招待・管理
                            </h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>「ユーザー管理」メニューから「ユーザーを招待」をクリックし、招待したい方のメールアドレス・お名前（任意）を入力して招待メールを送信します。</li>
                                <li>メンバーの退職等に伴うユーザーアカウントの削除は、同画面のリスト一覧にある各ユーザーの「削除」ボタンから行えます（元に戻せないのでご注意ください）。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
