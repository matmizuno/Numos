firebase.auth().onAuthStateChanged((user) => {

if(!user) {
    window.location.href = '/index.html';
}
});
// This code checks if a user is authenticated using Firebase Authentication.
// If the user is not authenticated, it redirects them to the 'index.html' page.