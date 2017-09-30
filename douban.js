var request = require('sync-request') //下载网页
var cheerio = require('cheerio') //解析网页

class Movie {
    constructor() {
        // 电影名/评分/引言/排名/封面图片链接
        this.name = ''
        this.score = 0
        this.quote = ''
        this.ranking = 0
        this.coverUrl = ''
        this.otherNames = ''
    }
}

var log = console.log.bind(console)

//缓存下载的原始页面
var cachedUrl = url => {
    var cacheFile = 'cached_html/' + url.split('?')[1] + '.html'
    // 读取缓存文件
    var fs = require('fs')
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        return data
    } else {
        var r = request('GET', url)
        var body = r.getBody('utf-8')
        // 写入缓存
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

//解析页面
var movieFromDiv = function(div) {
    var e = cheerio.load(div)
    var movie = new Movie()
    movie.name = e('.title').text()
    movie.score = e('.rating_num').text()
    movie.quote = e('.inq').text()
    let other = e('.other').text()
    movie.otherNames = other.slice(3).split(' / ').join('|')
    var pic = e('.pic')
    movie.ranking = pic.find('em').text()
    movie.coverUrl = pic.find('img').attr('src')

    return movie
}

// 下载页面
var moviesFromUrl = function(url) {
    // 调用 cached_url 来获取 html 数据
    var body = cachedUrl(url)
    // cheerio.load 把 HTML 文本解析为 DOM
    var e = cheerio.load(body)
    var movieDivs = e('.item')
    var movies = []
    for (var i = 0; i < movieDivs.length; i++) {
        var div = movieDivs[i]
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

//保存解析出来的数据
var saveMovie = function(movies) {
    var s = JSON.stringify(movies, null, 2)
    var fs = require('fs')
    var path = 'douban.txt'
    fs.writeFileSync(path, s)
}

// 用 request 库下载图片
var downloadCovers = movies => {
    var request = require('request')
    var fs = require('fs')
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        var path = 'covers/' + m.name.split('/')[0] + '.jpg'
        // 下载并保存图片
        request(url).pipe(fs.createWriteStream(path))
    }
}

var __main = function() {
    var movies = []
    for (var i = 0; i < 10; i++) {
        var start = i * 25
        var url = `https://movie.douban.com/top250?start=${start}&filter=`
        var moviesInPage = moviesFromUrl(url)
        movies = [...movies, ...moviesInPage]
    }
    saveMovie(movies)
    downloadCovers(movies)
}
__main()
