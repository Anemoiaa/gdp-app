from flask import render_template

from gdp_app import app

from gdp_app.countries import countriesList



@app.route('/')
def index():
	return render_template('index.html', countriesList=countriesList)


@app.route('/about')
def about():
	return render_template('about.html')