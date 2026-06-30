from django.shortcuts import render

# Create your views here.

def home(request):
    return render(request, "simulator/index.html")

def register(request):
    return render(request, "simulator/register.html")

def login(request):
    return render(request, "simulator/login.html")