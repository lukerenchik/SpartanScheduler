from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import json


courses = {}
current_course_name = None  # Initialize current course name as None
current_descriptions = {} 
# Setup the Chrome WebDriver
driver = webdriver.Chrome()

# Navigate to the webpage
driver.get('https://reg.msu.edu/Courses/search.aspx')

try:
    # Wait for the dropdown to be clickable and select it
    dropdown = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, 'MainContent_ddlSubjectCode'))  # Replace with the actual ID of the dropdown
    )

    # Assuming the dropdown is a SELECT element
    select = Select(dropdown)
    select.select_by_visible_text('CSE - Computer Science and Engineering')  # Replace with the actual text as seen in the dropdown

    submit_button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "MainContent_btnSubmit"))
)
    submit_button.click()
    # Wait for the h3 tags to be loaded after making the selection
    WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.TAG_NAME, 'h3'))
    )
    #Find elements by class name
    course_desc_elements = driver.find_elements(By.CLASS_NAME, 'test-contentCourseDesc')

    # First, find all h3 tags and store their text
    h3_tags = driver.find_elements(By.TAG_NAME, 'h3')
    h3_texts = [tag.text for tag in h3_tags]

    for element in course_desc_elements:
        text = element.text
        label, _, value = text.partition(':')
        label = label.strip()

        # Check if it's time to start a new course (when "Semester" is encountered)
        if label == "Semester":
            if current_course_name:  # If it's not the first course
                # Save the previous course's descriptions before moving to the next course
                courses[current_course_name] = {
                    'description': current_descriptions
                }
            # Update current course name and reset descriptions
            current_course_name = h3_texts.pop(0) if h3_texts else "Unknown Course"
            current_descriptions = {}

        # Append the current description to the current course
        current_descriptions[label] = value.strip()

    # Don't forget to add the last course's descriptions
    if current_course_name:
        courses[current_course_name] = {
            'description': current_descriptions
        }

    # Convert to JSON
    courses_json = json.dumps(courses, indent=4)
    print(courses_json)

    # Optionally, write to a file
    with open('courses.json', 'w') as file:
        file.write(courses_json)
        # Convert the dictionary to a JSON string
        courses_json = json.dumps(courses, indent=4)

                # Add any additional actions here

finally:
    # Close the browser
    driver.quit()