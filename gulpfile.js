'use strict'

const
	gulp = require('gulp'),
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
	iconfontCss = require('gulp-iconfont-css')
	
bem.b = true
bem.e = '_'

const 
	svgOptions = {
		plugins: [
			{addAttributesToSVGElement: {attributes: [
				{preserveAspectRatio: 'none'},
			]}},
			{removeViewBox: false},
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

function js() {
	return gulp.src('src/js/*.js', {sourcemaps: true})
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(gulp.dest('dev/js', {sourcemaps: '.'}))
		.pipe(bs.stream())
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
		timestamp: Math.round(Date.now()/1000),
		fontHeight: '1001',
		normalize: true,
	  }))
	 .pipe(gulp.dest('dev/fnt'))
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

function serve() {
	bs.init({
		server: 'dev',
		// browser: 'chrome',
		ghostMode: false,
		open: false,
	})
}

// tasks
gulp.task('default', gulp.parallel(serve, watch_html, watch_img, watch_fnt, watch_icons, watch_css, watch_js))

gulp.task('run', gulp.parallel(gulp.series(img, fnt, icons, css), html, js))

gulp.task('dev', gulp.series('run', 'default'))
