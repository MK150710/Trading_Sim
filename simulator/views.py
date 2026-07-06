from django.shortcuts import render
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required

# Create your views here.

def home(request):
    return render(request, "simulator/index.html")

def register(request):
    if request.method == "GET":
        return render(request, "simulator/register.html")

    elif request.method == "POST":
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password1"]
        check = request.POST["password2"]

        if password != check:
            return render(request, "simulator/register.html", {
                "error" : "Passwords do not match "
            })

        elif User.objects.filter(username=username).exists():
            return render(request, "simulator/register.html", {
                "error" : "Username Already Exists "
            })
        
        elif User.objects.filter(email=email).exists():
            return render(request, "simulator/register.html", {
                "error": "Email is already registered."
            })
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            user.first_name = first_name
            user.last_name = last_name
            user.save()

            auth_login(request, user)
            return redirect("dashboard")


def login(request):
    
    if request.method == "GET":
        return render(request, "simulator/login.html")
    
    elif request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return redirect("dashboard")

        else:
            return render(request, "simulator/login.html", {
                "error" : "Username or password incorrect"
            })
        
def logout(request):
    auth_logout(request)
    return redirect("home")

def dashboard(request):
    return render(request, "simulator/dashboard.html")