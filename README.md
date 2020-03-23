# Viral Sim - Corona Crowd Simulation
Created as part of the WirVsVirus Hackathon of the Federal Government of Germany.

Demo: https://christopherklug.de/showroom/viralgame/
Youtube: https://www.youtube.com/watch?v=-YHERqDDAuY 

# Inspiration
Inspired by an article in the Washington Post (https://www.washingtonpost.com/graphics/2020/world/corona-simulator/) we have set ourselves the goal of creating a simulation for the spread of a virus that can be influenced by input parameters.

# What it does
The simulation shows which measures can be taken to keep the curve of infected persons flat. This makes it possible to prevent deaths due to lack of hospital capacity. At the same time, the importance of social distance in the current situation becomes clear. And the phenomenon of herd immunity can be simulated.

# How we built it
The simulation is kept as simple as possible, which allows the execution in most web browsers. The complete logic is implemented in Javascript and html. We have used a physically correct particle simulation as a basic framework (https://codepen.io/djmot/pen/XNQEBy). We have removed superfluous calculation models, such as repulsion processes based on different masses. For this purpose, we adapted the simulation to the movement of people. The graph is created with the chart.js framework (https://www.chartjs.org/).

# Challenges we ran into
It is very complex to create a simulation that corresponds to the real world. But this is not at all the claim to our project. Rather, we want to use simple means to illustrate the influence that restricting movement, for example, has on the spread of a virus. At the same time, the importance of restricting movement will be shown, since otherwise hospital beds are not sufficient and thus significantly higher mortality rates are quickly reached.

# What's next
* Making simulation more realistic
* Complete revision of the UI
* Changing the parameters during the simulation

Authors:
* Jannis Hermann
* Christopher Klug
* Johannes Behrens