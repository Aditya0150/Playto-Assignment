import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'community_feed.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Post, Comment, Like

def seed():
    # 0. Clear existing data
    print("Resetting all data (Posts, Comments, Likes)...")
    Post.objects.all().delete()
    Comment.objects.all().delete()
    Like.objects.all().delete()

    # 1. Create Users (so you have accounts to log in with)
    users = ['Logan', 'Mickey', 'Luffy', 'Draken', 'Percy']
    print("Creating accounts...")
    
    for name in users:
        user, created = User.objects.get_or_create(username=name)
        user.set_password('password123')
        user.save()
        if created:
            print(f"- Created account: {name}")
        else:
            print(f"- Reset account password: {name}")

    # 2. Create an Admin account (Optional but recommended)
    admin_user, created = User.objects.get_or_create(username='admin')
    admin_user.set_password('admin123')
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    if created:
        print("- Created admin account: admin (password: admin123)")
    else:
        print("- Reset admin account password: admin123")

    print("\nDatabase setup complete! No posts were created.")
    print("You can now log in and post manually from the app.")

if __name__ == '__main__':
    seed()
