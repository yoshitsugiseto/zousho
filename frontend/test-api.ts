const main = async () => {
    try {
        const isbn = '9784873117584' // リーダブルコード
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
        const data = await res.json()
        console.log(data.items[0].volumeInfo)
    } catch (e) {
        console.error(e)
    }
}
main()
