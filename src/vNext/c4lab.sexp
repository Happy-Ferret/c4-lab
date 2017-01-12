(actor ("Devs")
       (edge :to "C4 Lab/UI" :description "Create/read/update designs")
       )
(system ("C4 Lab"
         :description "Web-based rapid prototyping of C4 diagrams to augment whiteboards")
        (container ("UI" :tech "html5, angularjs"
                         :description "prototype, import, export C4 diagrams" ))
        )
(system ("Github" :description "Free git and web hosting")
        (edge :to "C4 Lab/UI" :description "hosts")
        (edge :to "Travis-ci" :description "triggers build")
        )
(system ("Travis-ci" :description "Open source CI")
        (edge :to "Github" :description "publishes"))