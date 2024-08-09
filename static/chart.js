window.addEventListener('load', async ()=>{

        const ctx = document.getElementById('myChart').getContext('2d');
        const response = await fetch("/timecount");
        const data = await response.json();

        const month = data["month"]
        const year = data["year"]
        const week = data["week"]


        // Create a new Chart instance
        const myChart = new Chart(ctx, {
            type: 'line', // The type of chart (bar, line, pie, etc.)
            data: {
                labels: Object.keys(year),
                datasets: [{
                    label: 'year',
                    data: Object.values(year), // Data values
                    backgroundColor: 'rgba(255, 99, 132, 0.2)', // Background color of bars
                    borderColor: 'rgba(255, 99, 132, 1)', // Border color of bars
                    borderWidth: 1 // Width of the border
                }]
            },
            options: {
                lineTension: 0.5, 
                scales: {
                  x: {
                    grid: {
                      display: false // Removes the grid lines on the x-axis
                    }
                  },
                  y: {
                    grid: {
                      display: false // Removes the grid lines on the y-axis
                    },
                    beginAtZero: true,
                    suggestedMax: 15,
                  }
                },
                elements: {
                  point: {
                    radius: 0 // Removes the circles on the data points
                  }
                }
              }
        });
        document.querySelector("#loading-chart").remove()

        const select = document.querySelector("#chart-select")
        select.addEventListener("change", function(){
            let newData = null;
            if(select.value === "year"){
                newData = year;
            }
            if(select.value === "month"){
                newData = month;
            }
            if(select.value === "week"){
                newData = week;
            }
            myChart.data.datasets[0].data = Object.values(newData);
            myChart.data.labels = Object.keys(newData);
            myChart.data.datasets[0].label = select.value;
            myChart.update();
        })
})