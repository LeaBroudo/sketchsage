function changeImage( id ) {

    if (document.getElementById(id).src.includes("eye")) {
            document.getElementById(id).src = "styling/images/hide.svg";
    }
    else {
            document.getElementById(id).src = "styling/images/eye.svg";
    }

}

function toggleAbout() {

    var doc = document.getElementById("about");

    if (doc.style.display === "block") {
        doc.style.display = "none";
        document.getElementById("sidebar").style.display = "none";
        stageResize();

    } else {
        if (document.getElementById("sidebar").style.display = "none") {
            document.getElementById("sidebar").style.width = "300px";
            document.getElementById("sidebar").style.display = "block";
            stageResize();
        }

        doc.style.display = "block";
        document.getElementById("controls").style.display = "none";
    }
}

function toggleController() {

    var doc = document.getElementById("controls");
    
    if (doc.style.display === "none") {
        if (document.getElementById("sidebar").style.display = "none") {
            document.getElementById("sidebar").style.width = "200px";
            document.getElementById("sidebar").style.display = "block";
            stageResize();
        }

        doc.style.display = "block";
        document.getElementById("about").style.display = "none";
        
    } else {
        doc.style.display = "none";
        document.getElementById("sidebar").style.display = "none";
        stageResize();
    }

}

