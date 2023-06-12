#
# Client-side python app for photoapp, this time working with
# web service, which in turn uses AWS S3 and RDS to implement
# a simple photo application for photo storage and viewing.
#
# Project 02 for CS 310, Spring 2023.
#
# Authors:
#   Kelvin Forson
#   Prof. Joe Hummel (initial template)
#   Northwestern University
#   Spring 2023
#

import requests  # calling web service
import jsons  # relational-object mapping

import uuid
import pathlib
import logging
import sys
import os
import base64
import geocoder

from configparser import ConfigParser

import matplotlib.pyplot as plt
import matplotlib.image as img


###################################################################
#
# classes
#
class User:
  userid: int  # these must match columns from DB table
  email: str
  lastname: str
  firstname: str
  bucketfolder: str


class Asset:
  assetid: int  # these must match columns from DB table
  userid: int
  assetname: str
  bucketkey: str


class BucketItem:
  Key: str      # these must match columns from DB table
  LastModified: str
  ETag: str
  Size: int
  StorageClass: str


###################################################################
#
# prompt
#
def prompt():
  """
  Prompts the user and returns the command number
  
  Parameters
  ----------
  None
  
  Returns
  -------
  Command number entered by user (0, 1, 2, ...)
  """
  print()
  print(">> Enter a command:")
  print("   0 => end")
  print("   1 => stats")
  print("   2 => users")
  print("   3 => assets")
  print("   4 => download")
  print("   5 => download and display")
  print("   6 => bucket contents")
  print("   7 => user")
  print("   8 => image")
  print("   9 => search")

  cmd = int(input())
  return cmd


###################################################################
#
# stats
#
def stats(baseurl):
  """
  Prints out S3 and RDS info: bucket status, # of users and 
  assets in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/stats'
    url = baseurl + api

    res = requests.get(url)
    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract stats:
    #
    body = res.json()
    #
    print("bucket status:", body["message"])
    print("# of users:", body["db_numUsers"])
    print("# of assets:", body["db_numAssets"])

  except Exception as e:
    logging.error("stats() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

###################################################################
#
# search
#
def search(baseurl):
  """
  Finds all similar images to based on date or location
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    imageDate = input("Enter date (yy:mm:dd)\n>>")
    imageTime = input("Enter time (hh:mm:ss)\n>>")
    address = input("Enter the location. Eg. Near Chicago; 324 Foster St, Evanston\n>>")
    print("Searching for similar images with the specified dates and location\n\n") 

    api = '/search' + "?address=" + address + "&date=" + imageDate + imageTime
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract users:
    #
    body = res.json()
    #

    # Display results to client
    images = body['data']

    print("Results\nIndex AssetId\n")
    for i, img in enumerate(images):
      print(i+1, "\t", img['assetid'])
    

  except Exception as e:
    logging.error("search() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

###################################################################
#
# users
#
def users(baseurl):
  """
  Prints out all the users in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/users'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract users:
    #
    body = res.json()
    #
    # let's map each dictionary into a User object:
    #
    users = []
    for row in body["data"]:
      user = jsons.load(row, User)
      users.append(user)
    #
    # Now we can think OOP:
    #
    for user in users:
      print(user.userid)
      print(" ", user.email)
      print(" ", user.lastname, ",", user.firstname)
      print(" ", user.bucketfolder)

  except Exception as e:
    logging.error("users() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


###################################################################
#
# assets
#
def assets(baseurl):
  """
  Prints out all the assets in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/assets'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract assets:
    #
    body = res.json()
    #
    # let's map each dictionary into a Asset object:
    #
    assets = []
    for row in body["data"]:
      asset = jsons.load(row, Asset)
      assets.append(asset)
    #
    # Now we can think OOP:
    #
    for asset in assets:
      print(asset.assetid)
      print(" ", asset.userid)
      print(" ", asset.assetname)
      print(" ", asset.bucketkey)

  except Exception as e:
    logging.error("assets() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


###################################################################
#
# download
#
def download(baseurl, showImage = 0):
  """
  Downloads binary file from s3_bucket
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    assetid = input('Enter asset id> \n')
    api = '/download'
    url = baseurl + api + '/' + assetid

    res = requests.get(url)
    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
    #
    # deserialize and extract asset parameters:
    #
    body = res.json()

    if body["message"] == "no such asset...":
      print("No such asset...")
      return
    print("userid:", body["user_id"])
    print("asset name:", body["asset_name"])
    print("bucket key:", body["bucket_key"])
    decoded_bytes = base64.b64decode(body["data"])
    output_file = open(body["asset_name"], "wb")
    output_file.write(decoded_bytes)
    print("Downloaded from S3 and saved as \'", body["asset_name"], "\'")

    if showImage:
      image = img.imread(body["asset_name"])
      plt.imshow(image)
      plt.show()

  except Exception as e:
    logging.error("download() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

###################################################################
#
# showBucketContents
#
def showBucketContents(url):
  res = requests.get(url)
  if res.status_code != 200:
    # failed:
    print("Failed with status code:", res.status_code)
    print("url: " + url)
    if res.status_code == 400:  # we'll have an error message
      body = res.json()
      print("Error message:", body["message"])
    return [], "n"
    
  body = res.json()
  if 'data' not in body:
    return [], "n"

  if len(body['data']) == 0:
    return [], "n"
  
  bucketItems = []
  for row in body["data"]:
    bucketItem = jsons.load(row, BucketItem)
    bucketItems.append(bucketItem)

  for bucketItem in bucketItems:
    print(bucketItem.Key)
    print(" ", bucketItem.LastModified)
    print(" ", bucketItem.Size)
  displayPage = str(input("another page? [y/n]"))
  print("\n")
  return bucketItems, displayPage 


###################################################################
#
# bucket
#
def bucket(baseurl):
  """
  displays information about each bucket asset
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """
  try:
    #
    # call the web service:
    #
    api = '/bucket'
    url = baseurl + api

    bucketItems, displayPage = showBucketContents(url)

    while (displayPage.strip().lower() == "y"):
      api = '/bucket?startafter=' + str(bucketItems[-1].Key)
      url = baseurl + api
      bucketItems, displayPage = showBucketContents(url)
      

  except Exception as e:
    logging.error("bucket() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return
    
###################################################################
#
# image
#
def image(baseurl):
  """
  upload an image to the bucket folder of the specified user
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """
  try:
    #
    # call the web service:
    #
    userid = input('Enter userid>\n')
    assetname = input('Enter assetname\n')
    api = '/image'
    url = baseurl + api + "/" + userid

    asset = open(assetname, 'rb')
    byteData = asset.read()
    asset.close()
    encodedFile = base64.b64encode(byteData)
    encodedStr = encodedFile.decode()

    data = {
      'assetname': assetname,
      'data': encodedStr
    }

    res = requests.post(url, json = data)
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print(body)
        print("Error message:", body["message"])

  except Exception as e:
    logging.error("bucket() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return
#########################################################################
# main
#
print('** Welcome to PhotoApp v2 **')
print()

# eliminate traceback so we just get error message:
sys.tracebacklimit = 0

#
# what config file should we use for this session?
#
config_file = 'photoapp-client-config'

print("What config file to use for this session?")
print("Press ENTER to use default (photoapp-config),")
print("otherwise enter name of config file>")
s = input()

if s == "":  # use default
  pass  # already set
else:
  config_file = s

#
# does config file exist?
#
if not pathlib.Path(config_file).is_file():
  print("**ERROR: config file '", config_file, "' does not exist, exiting")
  sys.exit(0)

#
# setup base URL to web service:
#
configur = ConfigParser()
configur.read(config_file)
baseurl = configur.get('client', 'webservice')

# print(baseurl)

#
# main processing loop:
#
cmd = prompt()

while cmd != 0:
  #
  if cmd == 1:
    stats(baseurl)
  elif cmd == 2:
    users(baseurl)
  elif cmd == 3:
    assets(baseurl)
  elif cmd == 4:
    download(baseurl)
  elif cmd == 5:
    download(baseurl, 1)
  elif cmd == 6:
    bucket(baseurl)
  elif cmd == 8:
    image(baseurl)
  elif cmd == 9:
    search(baseurl)
  else:
    print("** Unknown command, try again...")
  #
  cmd = prompt()

#
# done
#
print()
print('** done **')
