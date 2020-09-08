'use strict'

const
	gulp = require('gulp'),
	del = require('del'),
	rename = require('rename'),
	newer = require('gulp-changed'),
	pug = require('gulp-pug'),
	bem = require('pug-bem'),
	postcss = require('gulp-postcss'),
	less = require('gulp-less'),
	less_newer = require('gulp-less-changed'),
	babel = require('gulp-babel'),
	bs = require('browser-sync').create(),
	imgmin = require('gulp-imagemin'),
	iconfont = require('gulp-iconfont'),
	iconfontCss = require('gulp-iconfont-css'),
	htmlmin = require('gulp-htmlmin'),
	jsmin = require('gulp-uglify'),
	ghPages = require('gulp-gh-pages')

bem.b = true
bem.e = '_'

const 
	svgOptions = {
		plugins: [
			{addAttributesToSVGElement: {attributes: [
				{preserveAspectRatio: 'none'},
			]}},
			{removeViewBox: false},
			{removeUnknownsAndDefaults: false}
		],
	},
	pugOptions = {
		basedir: 'src/pug',
		plugins: [bem],
	}

function html() {
	return gulp.src('src/pug/*.pug')
		.pipe(pug(pugOptions))
		.pipe(gulp.dest('dev'))
		.pipe(bs.stream())
}

function min_html() {
	return gulp.src('dev/*.html')
		.pipe(htmlmin({
			// collapseWhitespace: true,
			// conservativeCollapse: true,
			removeComments: true,
			minifyCSS: true,
			minifyJS: true,
		}))
		.pipe(gulp.dest('build'))
}

function css() {
	return gulp.src('src/less/*.less', {sourcemaps: true})
	// .pipe(less_newer({getOutputFileName: file => rename(file, {dirname: 'dev/css', extname: '.css'})}))
	.pipe(less({strictMath: 'on'}))
		.pipe(postcss([
			require('postcss-inline-svg')({
				paths: ['dev/img'],
			}),
			// require('postcss-svgo')(svgOptions),
			require('postcss-pseudo-class-enter'),
		],
		))
		.pipe(gulp.dest('dev/css', {sourcemaps: '.'}))
		.pipe(bs.stream())
}

function min_css() {
	return gulp.src('dev/css/*.css')
		.pipe(postcss([
			require('autoprefixer'),
			require('postcss-csso')({
				debug: true,
				comments: false,
			}),
			require('css-mqpacker')({
				sort: true,
			}),
			require('postcss-mq-last'),
		]))
		.pipe(gulp.dest('build/css'))
}

function js() {
	return gulp.src('src/js/*.js', {sourcemaps: true})
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(gulp.dest('dev/js', {sourcemaps: '.'}))
		.pipe(bs.stream())
}

function min_js() {
	return gulp.src('dev/js/*.js')
		.pipe(jsmin())
		.pipe(gulp.dest('build/js'))
}

function img() {
	return gulp.src('src/img/**', {since: gulp.lastRun(img)})
		.pipe(newer('dev/img'))
		.pipe(imgmin([
				imgmin.gifsicle(),
				imgmin.mozjpeg(),
				imgmin.optipng(),
				imgmin.svgo(svgOptions)
			]))
		.pipe(gulp.dest('dev/img'))
		.pipe(bs.stream())
}

function fnt() {
	return gulp.src('src/fnt/*', {since: gulp.lastRun(fnt)})
		.pipe(newer('dev/fnt'))
		.pipe(gulp.dest('dev/fnt'))
		.pipe(bs.stream())
}

function icons() {
  return gulp.src('dev/img/fnt/*.svg')
	 .pipe(iconfontCss({
		fontName: 'icons',
		cssClass: 'ifnt',
		path: 'src/less/template/_iconfont-template.less',
		targetPath: '../../src/less/template/_icons.less',
		fontPath: 'dev/fnt',
	 }))
	 .pipe(iconfont({
		fontName: 'icons',
		prependUnicode: true,
		formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
		timestamp: Math.round(Date.now() / 1000),
		fontHeight: '1001',
		normalize: true,
	  }))
	 .pipe(gulp.dest('dev/fnt'))
}

function copy_root() {
	return gulp.src('src/root/*', {since: gulp.lastRun(fnt)})
		.pipe(newer('dev'))
		.pipe(gulp.dest('dev'))
		.pipe(bs.stream())
}

function copy_assets(cb) {
	gulp.src('src/root/*')
		.pipe(gulp.dest('build'))
	gulp.src(['dev/img/**', 'dev/fnt/**'], {base:'dev/'})
		.pipe(gulp.dest('build'))
	cb()
}

function clear_dev() {
	return del(['dev/'])
}

function clear_build() {
	return del(['build/'])
}

function deploy() {
	return gulp.src('build/**')
		.pipe(ghPages())
}

// watch
function watch_html() {
	return gulp.watch('src/pug/', html)
}

function watch_css() {
	return gulp.watch('src/less', css)
}

function watch_js() {
	return gulp.watch('src/js', js)
}

function watch_img() {
	return gulp.watch('src/img', img)
}

function watch_fnt() {
	return gulp.watch('src/fnt', fnt)
}

function watch_icons() {
	return gulp.watch('dev/img/fnt', icons)
}

function watch_root() {
	return gulp.watch('src/root', copyToRoot)
}

function serve() {
	bs.init({
		server: 'dev',
		// browser: 'chrome',
		ghostMode: false,
		open: false,
	})
}

// tasks
gulp.task('default', gulp.parallel(serve, watch_html, watch_img, watch_fnt, watch_icons, watch_css, watch_js, watch_root))

gulp.task('run', gulp.series(
	clear_dev,
	gulp.parallel(
		gulp.series(img, fnt, icons, css),
		html, js, copy_root
	)
))

gulp.task('min', gulp.series(
	clear_build,
	gulp.parallel(min_html, min_css, min_js, copy_assets),
	deploy
))

gulp.task('dev', gulp.series('run', 'default'))
gulp.task('build', gulp.series('run', 'min'))
