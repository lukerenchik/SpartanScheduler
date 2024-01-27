from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import json


courses = {}
# Setup the Chrome WebDriver
driver = webdriver.Chrome()

# Navigate to the webpage
driver.get('https://reg.msu.edu/Courses/search.aspx')

try:

    courses = {}

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


    # Assuming h3_texts contain course names and course_desc_elements contain descriptions
    for index, course_name in enumerate(h3_texts):
        # Initialize an empty dictionary for the current course's descriptions
        descriptions = {}

        # Calculating the start and end indices for the descriptions of the current course
        start_index = index * 7  # Assuming each course has exactly 7 description elements
        end_index = start_index + 7

        # Extracting the descriptions for the current course
        for desc_index in range(start_index, min(end_index, len(course_desc_elements))):
            desc_element = course_desc_elements[desc_index]
            # Assuming the format "Label: Value"
            label, _, value = desc_element.text.partition(':')
            descriptions[label.strip()] = value.strip()

        # Adding the course along with its descriptions to the courses dictionary
        courses[course_name] = {
            'description': descriptions
        }

    # Convert to JSON
    courses_json = json.dumps(courses, indent=4)
    print(courses_json)

    # Optionally, write to a file
    with open('courses.json', 'w') as file:
        file.write(courses_json)

finally:
    # Close the browser
    driver.quit()