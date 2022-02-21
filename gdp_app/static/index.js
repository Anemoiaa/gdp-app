import 'https://cdn.jsdelivr.net/npm/echarts@5.3.0/dist/echarts.min.js'

class Request {
	constructor(country, date){
		this.country = country
		this.date = date
		this.url = `https://api.worldbank.org/v2/countries/${this.country}\
		/indicators/NY.GDP.MKTP.CD?format=json&date=${this.date}`
	}

	async getData(){
		try {
			const response = await fetch(this.url)
			const json = await response.json()
			if('message' in json[0]){
				this.error = "Data does not exist"	
			}
			return json[1]
		}
		catch(error){
			this.error = 'Bad request or API problems'
			
		}
	}
}


class Chart {
	constructor(chart, type){
		this.chart = echarts.init(chart)
		this.type = type
	}
	makeOption(){
		if(this.type == 'main'){
			const years = this.data.map(obj => obj.date).reverse()
			const values = this.data.map(obj => Math.trunc(obj.value)).reverse()
			const title = `GDP ${this.data[0].country.value} / ${years[0]} - ${years[years.length-1]}`
			return {
				grid: {
					right: '1%'
				},
				title: {
    				text: title
    			},
        		tooltip: {},
        		xAxis: {
        			data:years
        		},
        		yAxis: {},
        		series: [
        			{
	        			name: 'GDP  (current $)',
	            		type: 'bar',
	            		data: values
          			}
        		]
      		}	
		} 
		else if(this.type == 'compare'){
			const countriesName = this.data.map(list => list[0].country.value)
			const years = this.data[0].map(obj => obj.date).reverse()
			const seriesObjects = this.data.map(list => {
				return {
					name: list[0].country.value,
					type: 'line',
					step: 'middle',
					data:  list.map(obj => Math.trunc(obj.value)).reverse()
				}
			})
			return {
				grid: {
					right: '1%'
				},
				title: {
    				text: 'Comparison'
    			},
		  		tooltip: {
		    		trigger: 'axis'
		    	},
				legend: {
					data: countriesName
		  		},
		  		toolbox: {
				    feature: {
				    	saveAsImage: {}
				    }
	  			},
		  		xAxis: {
				    type: 'category',
				    
				    data: years
		  		},
		  		yAxis: {
		    		type: 'value'
		  		},
		  		dataZoom: [{
					    start: 0,
					    type: "inside",
					    yAxisIndex: [0, 3]
				},
					{ 
		            	yAxisIndex: 4     
		        	}
				],
		  		series: seriesObjects
			}
		}
	}

	async createChart(country=['GE'], date='1990:2020'){
		if(country.length == 1){
			const request = new Request(country, date)
			this.data = await request.getData()
			if('error' in request){
				setAlert(`Data does not exist: ${request.country}`)
				return false
			}
    	}
    	else {
    		this.date = '2010:2020'
    		if(!this.data){
    			this.data = []
    		}
			for(let i = 0; i < country.length;i++){
				const request = new Request(country[i], this.date)
				const obj = await request.getData()
				if('error' in request){
					if(request.country == "Select country"){
						continue
					}
					setAlert(`Data does not exist: ${request.country}`)
					continue
				}
				this.data[i] = obj
			}
    	}
    	this.option = this.makeOption()
      	this.chart.setOption(this.option)
      	return true
	}
	updateYears(startYear){
		const dataUpdate = this.data.filter(obj => {
			return obj.date >= startYear
		})
		const years = dataUpdate.map(obj => obj.date).reverse()
		const values = dataUpdate.map(obj => Math.trunc(obj.value)).reverse()
		const title = this.option.title.text.split('/')[0]
		this.option.title.text = `${title}/ ${years[0]} - ${years[years.length-1]}`
		this.option.xAxis.data = years
		this.option.series[0].data = values
		this.chart.setOption(this.option)
	}
}


/* funtions */

const setAlert = (message) => {
	let area = document.getElementById('alert-area')
	area.querySelectorAll('span')[0].innerHTML = message
	area.setAttribute('style', 'display: block')
}

const closeAlert = () => {
	document.getElementById('alert-area').setAttribute('style', 'display:none')
}

const ALERT_CLOSE_BTN = document.getElementById('alert-close')
ALERT_CLOSE_BTN.addEventListener('click', closeAlert)

/* Chart init */

const MAIN_CHART = new Chart(document.getElementById('main-chart'), 'main')
await MAIN_CHART.createChart()

const COMPARE_CHART = new Chart(document.getElementById('compare-chart'), 'compare')
await COMPARE_CHART.createChart(['UA', 'GE', 'AM','AZ'], '2010:2020')


/* charts years&country update */

document.querySelectorAll('div.chart').forEach((div) =>{
	
	/* main chart*/
	if(div.className.includes('main')){
		div.querySelector('input').addEventListener('input', (e) => {
			div.querySelector('label').innerHTML = e.target.value
		})
		div.querySelector('input').addEventListener('mouseup', () => {
			MAIN_CHART.updateYears(div.querySelector('input').value)
		})
		div.querySelector('input').addEventListener('touchend', () => {
			MAIN_CHART.updateYears(div.querySelector('input').value)
		})
		/*country update*/
		div.querySelector('select').addEventListener('input', async (e) => {
			closeAlert()
			const country = e.target.value
			const years = div.querySelector('input').value
			if(await MAIN_CHART.createChart([country])){
				MAIN_CHART.updateYears(years)	
			}
		})	
	}
	
	else{
		/*compare chart*/
		div.querySelectorAll('select').forEach((select) => {
			select.addEventListener('input' , () => {
				closeAlert()
				const countries = div.querySelectorAll('select')
				let arr = []
				for(let i = 0; i < countries.length; i++){
					arr.push(countries[i].value)
				}
				COMPARE_CHART.createChart(arr)
			})
		})
	}
})



window.onresize = () => {
    MAIN_CHART.chart.resize()
    COMPARE_CHART.chart.resize()

}