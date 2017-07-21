var request = require('sync-request') //下载网页
var cheerio = require('cheerio') //解析网页

class Movie {
    constructor() {
        // 分别是电影名/评分/引言/排名/封面图片链接
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
    // 如果存在就读取缓存文件
    // 如果不存在就下载并写入缓存文件
    var fs = require('fs')
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        // log(' data', data)
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

    // 创建一个电影类的实例并且获取数据
    // 这些数据都是从 html 结构里面人工分析出来的
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

// 下载页面 (内包含 解析页面  和 缓存页面 的函数)
var moviesFromUrl = function(url) {
    // 调用 cached_url 来获取 html 数据
    var body = cachedUrl(url)
    // cheerio.load 用来把 HTML 文本解析为一个可以操作的 DOM
    var e = cheerio.load(body)
    var movieDivs = e('.item')
    // 循环处理 25 个 .item
    var movies = []
    for (var i = 0; i < movieDivs.length; i++) {
        var div = movieDivs[i]
        // 用 movieFromDiv 函数来获取到一个 movie 对象
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

//保存解析出来的数据
var saveMovie = function(movies) {
    var s = JSON.stringify(movies, null, 2)
    // 把 json 格式字符串写入到 文件 中
    var fs = require('fs')
    var path = 'douban.txt'
    fs.writeFileSync(path, s)
}

// 使用 request 库来下载图片
var downloadCovers = movies => {

    var request = require('request')
    var fs = require('fs')
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        // 保存图片的路径
        var path = 'covers/' + m.name.split('/')[0] + '.jpg'
        // 下载并保存图片
        request(url).pipe(fs.createWriteStream(path))
    }
}

var __main = function() {
    // 主函数
    var movies = []
    for (var i = 0; i < 10; i++) {
        var start = i * 25
        var url = `https://movie.douban.com/top250?start=${start}&filter=`
        var moviesInPage = moviesFromUrl(url)
        // 注意这个 ES6 的语法
        movies = [...movies, ...moviesInPage]
    }
    saveMovie(movies)
    // download covers
    downloadCovers(movies)
}


__main()
