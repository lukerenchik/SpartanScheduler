import requests
from bs4 import BeautifulSoup

# The URL of the website you want to scrape
url = 'https://reg.msu.edu/Courses/search.aspx'

# Use requests to get the content of the webpage
response = requests.get(url)

# Ensure the request was successful
if response.status_code == 200:
    html_content = response.text
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find all h3 tags with the course information
    courses = soup.find_all('h3')

    # Loop through each course and extract the text
    for course in courses:
        course_text = course.get_text(strip=True)
        print(course_text)
else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
