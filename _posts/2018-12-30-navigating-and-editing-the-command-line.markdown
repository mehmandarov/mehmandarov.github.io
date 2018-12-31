---
title: "Navigating and Editing the Command Line – Bash Edition"
layout: post
date: 2018-12-30 21:01
image: '/assets/images/posts-images/laptop.jpg'
description:
tag:
- command line
- bash
- field notes
- english
category: blog
star: false
author: rustam.mehmandarov
---

_A cheat sheet for moving around and editing your command line – Bash Edition._

- [Moving Around the Command Line](#moving-around-the-command-line)
- [Editing Commands in the Command Line](#editing-commands-in-the-command-line)
- [Bonus](#bonus)

---

Using the command line can simplify and even automate many of the operations we do on a computer. However, using the command line can mean quite a bit of typing and a possibly large number of parameters. In this post, I would like to focus on how to navigate the cursor and edit the command line, while leaving all the other Bash tricks for the future posts.

I also have created simple graphics to illustrate some of the main shortcuts listed below. This (hi-res) image can be printed for future reference.

![Navigating and Editing the Command Line (Bash Edition)] [1]
<figcaption class = "caption"> Navigating and Editing the Command Line (Bash Edition)</figcaption>


---

## Moving Around the Command Line

So, let's first speak about how to move the cursor around – because using just arrow keys is often not the most optimal way of navigating. Sometimes you might want to go to the beginning of the line, to the end of the line, or simply jump from one _word_ to another, where _word_ – in this context – is set of characters separated by spaces (or sometimes other special characters), or as [documentation][2] states it: 

> A sequence of characters considered as a single unit by the shell. Also known as a token.


{% highlight text %}
# Moving the cursor – fast
CTRL+a         Go to the beginning of the line (same as Home)
CTRL+e         Go to the End of the line (same as End)
ALT+b / ESC+b  Go one word back (to the left)
ALT+f / ESC+f  Go one word forward (to the right)

# Moving the cursor – one character at a time
CTRL+f         Go forward one character
CTRL+b         Go backward one character

# Using history
CTRL+r         Backwards search in previously executed commands (history)
CTRL+p         Previous command (same as Up arrow)
CTRL+n         Next command (same as Down arrow)
{% endhighlight %}

---

## Editing Commands in the Command Line

Now that we are able to navigate freely along the command line, it is time to do some modifications. Here, we will see how to delete, cut, paste, and swap words and characters.

{% highlight text %}
# Deleting whole words
ALT+Del        Delete the word before (to the left of) the cursor
ALT+d / ESC+d  Delete the word after (to the right of) the cursor
CTRL+w         Cut the word before the cursor to the clipboard

# Deleting parts of the line
CTRL+k         Cut the line after the cursor to the clipboard
CTRL+u         Cut/delete the line before the cursor to the clipboard

# Deleting single characters
CTRL+d         Delete character under the cursor (same as Delete key)
CTRL+h         Delete character before the cursor (same as Backspace key)

# Paste, Undo, revert, and more
CTRL+l         Clear the screen (similar to the 'clear' command)
CTRL+y         Paste the last thing to be cut (yank)
CTRL+_         Undo
ALT+r / ESC+r  Revert the changes and replace with the line as it was 
                in History.

# Swap 'em!
CTRL+t         Swap the last two characters before the cursor
ALT+t / ESC+t  Swap current word with previous
 
# Convert to UPPER, lower, or Sentence case
ALT+u / ESC+u  Capitalise characters from the cursor to the end of 
                the current word and move to the end of the word.
ALT+l / ESC+l  Lower the case of characters from the cursor to the
                end of the current word and move to the end of the word.
ALT+c / ESC+c  Capitalize the character under the cursor position 
                and move to the end of the word.
{% endhighlight %}

---

## Bonus

First, the most obvious – you can always find more gems in the `man` pages for Bash both in your terminal and online (for instance on this [mirror][2]). To view it in your terminal, type:

{% highlight bash %}
$ man bash
{% endhighlight %}

Now, over to something different. Since we have been talking about the command line and shells it is worth mentioning some less-known (and sometimes _"as a curiosity"_) shortcuts in another terminal – Command Prompt, `cmd.exe`:

{% highlight text %}
Function keys in cmd.exe:
  - F1: Pastes the last executed command (character by character)
  - F2: Pastes the last executed command (up to the entered character)
  - F3: Pastes the last executed command
  - F4: Deletes current prompt text up to the entered character
  - F5: Pastes recently executed commands (does not cycle)
  - F6: Pastes ^Z to the prompt
  - F7: Displays a selectable list of previously executed commands
  - F8: Pastes recently executed commands (cycles)
  - F9: Asks for the number of the command from the F7 list to paste
{% endhighlight %}

_Good luck! Try them out and let me know how that goes!_

---

[1]: {{ site.url }}/assets/images/posts-images/2018-12-30-bash_navigation.png
[2]: https://linux.die.net/man/1/bash
