The signed up users will be stored in users.json with name, email, password, passwordConfirm and admin as yes or no(based on whether they selected the checkbox or not) 
If signed up user is not an admin but a normal user his cart will be created in cart.json

Place your email and app password in .env file
write email as EMAIL_USER=youremail@gmail.com
write app password as EMAIL_PASS=16 digit password

To generate app passowrd, follow the steps below
1.Go to your Google Account settings
https://myaccount.google.com/

2.In the left sidebar, click "Security"

3.Under "Signing in to Google", ensure:
2-Step Verification is ON
If not, set it up first

4.After enabling 2FA, you'll see an option: "App Passwords"

5.Click "App Passwords"
(You may need to re-enter your password)

6.Under "Select app", choose:
Mail

7.Under "Select device", choose:
Other (Custom name) → give a name like Nodemailer

8.Click "Generate"

9.You'll get a 16-character app password (e.g., abcd efgh ijkl mnop)
Copy it and use it in your code (no spaces)
