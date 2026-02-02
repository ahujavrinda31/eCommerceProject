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


ABOUT PROJECT:
This is an eCommerce Project named as ExpressMart, consisting of 4 roles- Admin, User, Seller, Transporter. Signup and Forgot Password option is OTP-based. 
Admin can:
1. View existing users and can also remove them.
2. When a new seller or transporter signs in, their request goes to admin and admin approves request they can login and if he rejects they can't.
3. Admin can add new category or subcategory and can also edit existing ones.
4. When user makes an order, it goes to admin and he assigns transporter for it.
5. Also he can view products provided by different sellers and can also remove them.

User can:
1. Add products to his cart.
2. Buy products individually or from cart.
3. Search products based on category or name.
4. View order history and can only cancel order before it is out for delivery.
5. View and edit profile except email.

Seller can:
1. Add, Edit, Delete product inside any existing category and subcategory.
2. View history of the products purchased which he sells.
3. Can view and edit his profile except email.
4. Must give GST number at time of signup.
5. Search product based on name.

Transporter can:
1. View and edit his profile except email.
2. Delivers order by changing status from Placed to Out for delivery and out for delivery to delivered.
3. Must give Vehicle Number at the time of login.
