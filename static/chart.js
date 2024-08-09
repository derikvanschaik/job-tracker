window.addEventListener('load', ()=>{

    setTimeout(()=>{
        const ctx = document.getElementById('myChart').getContext('2d');
    
        // Create a new Chart instance
        const myChart = new Chart(ctx, {
            type: 'line', // The type of chart (bar, line, pie, etc.)
            data: {
                labels: ['January', 'February', 'March', 'April', 'May'], // Labels for the x-axis
                datasets: [{
                    label: 'My First Dataset',
                    data: [12, 19, 3, 5, 2], // Data values
                    backgroundColor: 'rgba(255, 99, 132, 0.2)', // Background color of bars
                    borderColor: 'rgba(255, 99, 132, 1)', // Border color of bars
                    borderWidth: 1 // Width of the border
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true // Start the y-axis at zero
                    }
                },
                lineTension: 0.5
            }
        });
        document.querySelector("#loading-chart").remove()
    }, 1000);
})