all:

ci:
	git ci . -m "Worked on videocast."
	git push

site:
	chromium index.html
