function changeImage( id ) {

    if (document.getElementById(id).src.includes("eye")) {
            document.getElementById(id).src = "styling/images/hide.svg";
    }
    else {
            document.getElementById(id).src = "styling/images/eye.svg";
    }
    
}