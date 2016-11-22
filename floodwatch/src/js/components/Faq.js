// @flow

import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';

import '../../css/Faq.css';

export class Faq extends Component {
  render() {
    return (
      <div id="faqpp">
        <Row className="section" id="faq">
          <Col>
            <h1 className="centered"><a name="faq">FAQ</a></h1>

            <h4 className="header"><a name="adblock">Does Floodwatch work with Adblock, Ghostery, etc.?</a></h4>
            <p>Floodwatch unfortunately does not work with AdBlock, or any other service that blocks ad images from loading. <span className="italics">You will have to turn off or remove your adblocker (not just pause it) in order to use Floodwatch.</span></p>
            <p>Floodwatch looks at the images on a website after that website has finished loading, which means that any service that stops the images from loading in the first place is not compatible. (Other anti-tracking tools that do not block images from loading should still work with Floodwatch, and the extension may still work with Ghostery, depending on its settings.)</p>
            <p>Floodwatch does have the ability to remove ads once it has taken a snapshot of them. This is a good option for people who want to use Floodwatch, but prefer not to see ads. You can toggle this option in the extension settings.</p>


            <h4 className="header"><a name="info">Why am I being asked for my demographic information? Do I have to give any?</a></h4>
            <p>The reason why we ask for demographic information is because advertisers base their advertising decisions on what demographic they believe you to be--a practice that can easily turn discriminatory.</p>
            <p>Advertisers are constantly looking to refine their demographic profile of a given person in order to serve them the ads they think “fit” their interest group. For certain factors, that’s an acceptable practice: for example, it makes sense to serve more sports advertising to people who visit more sports websites. </p>
            <p>For many other factors, however, this practice is not only unethical, but illegal: for example, Facebook allowing advertisers to exclude certain races from particular job and housing postings (as shown by Propublica <a className="underlined" href="https://www.propublica.org/article/facebook-lets-advertisers-exclude-users-by-race" target="_blank">here</a>). </p>
            <p>Without being able to show advertising trends as experienced by large groups, it’s hard to prove that these discriminatory behaviors are happening. This is why Floodwatch asks for your demographic data: because knowing who’s getting served what ads helps our researchers uncover large-scale trends of discriminatory practices.</p>
            <p>The more demographic information you volunteer, the more information our researchers have to find these connections. That said, Floodwatch will never require users to give up demographic information in order to use the tool: you will still be able to collect ads and compare your ad breakdown to that of the average Floodwatch user.</p>
            <p>Jump to our <a href="#privacy" className="underlined">Privacy Policy</a> to learn more about the risks of providing personal information to anyone, and to see how Floodwatch protects your data.</p>


            <h4 className="header"><a name="adtypes">What kinds of ads do you collect? Why aren’t I seeing more ads on the My Ads page?</a></h4>
            <p>Ad detection is a tricky problem for many reasons, and we are constantly working on improving our detection algorithm. The more users we have, the better we become at detecting different kinds of ads.</p>
            <p>Floodwatch only collects image-based ads, and therefore can miss text-based ads on a website. We’re also working on recording Flash ads, but are not currently able to do so.</p>
            <p>If you’re not seeing any ads displayed on your History page, please first try browsing for a little longer, before reporting a bug on our public <a className="underlined" href="https://github.com/O-C-R/floodwatch-extension" target="_blank">Github repository</a>, or contacting us at <a href="mailto:floodwatch@ocr.nyc" className="underlined" target="_top">floodwatch@ocr.nyc</a>.</p>


            <h4 className="header"><a name="otherads">Why do I see other ads in my ad stream?</a></h4>
            <p>Sometimes our ad classification system gets it wrong: it can be confused by an image that is the same size as a standard ad, or perhaps because the URL for the image closely matches one for images that have been correctly classified as ads in the past.</p>
            <p>We appreciate your help in marking these images as falsely classified--this will help improve our algorithm and prevent them from reappearing in your ad stream.</p>


            <h4 className="header"><a name="browsers">Does Floodwatch plan to expand to other browsers?</a></h4>
            <p>Currently, we have a very small development team supporting Floodwatch. We plan to expand to other browsers eventually, but are currently focusing our efforts on bug fixes and improvements to the Chrome version of the extension.</p>
            <p>The Floodwatch extension is <a className="underlined" href="https://github.com/O-C-R/floodwatch-extension" target="_blank">open source</a>, so if you’re interested in porting Floodwatch to other browsers, feel free to fork it.</p>


            <h4 className="header"><a name="bugs">I found a bug! What should I do?</a></h4>
            <p>We’re working hard to fix bugs and make improvements. Email us at <a href="mailto:floodwatch@ocr.nyc" className="underlined" target="_top">floodwatch@ocr.nyc</a> to report it, or check the Issues list on our <a className="underlined" href="https://github.com/O-C-R/floodwatch-extension" target="_blank">Github repository</a>, where you can see if the bug has already been filed or file a new one.</p>

          </Col>
        </Row>
        <Row className="section" id="privacy">
          <Col>
            <h1 className="centered"><a name="privacy">Privacy Policy</a></h1>
            <h4 className="header"><a name="risks">What are the risks in offering up my demographic or advertising information?</a></h4>
            <p>There is implicit risk in having your demographic data collected by anyone--whether passively by an advertiser, or actively by an app like Floodwatch. Even when that data is ostensibly anonymized, there are reidentification techniques that can take simple demographic or preference factors and associate a profile with its true owner. Consider the following:
            </p>
            <ul>
              <li>In 2000, Latanya Sweeney demonstrated that 87% of the US population could be uniquely identified with just their zip code, gender, and date of birth. (<a className="underlined" href="http://dataprivacylab.org/projects/identifiability/paper1.pdf" target="_blank">Source.</a>)</li>
              <li>In 2008, Narayanan and Shmatikov were able to use de-anonymization techniques to re-identify 500,000 Netflix subscribers, where the dataset only included dates and movie ratings. (<a className="underlined" href="https://www.cs.cornell.edu/~shmat/shmat_oak08netflix.pdf" target="_blank">Source.</a>)</li>
            </ul>
            <p>These risks exist regardless of the service to which you give your personal information. However, the risks are much higher when that information goes to unknown or non-accountable recipients.</p>
            <p>For example, online advertisers generally do not allow users any control over the data they collect, may store it in ways that make it much more vulnerable to access and re-identification, and may give or sell your information to third parties.</p>
            <p>Floodwatch has several security mechanisms in place to make sure your data is as safe as possible and controllable by you:</p>
            <ul>
              <li>You get to choose how much demographic information you’re comfortable giving us. (The core functionality of Floodwatch--collecting ads and seeing your ad breakdown--will always be available to all users.)</li>
              <li>We keep your data secure through the security industry’s best practices. Want to see exactly how our extension code works? It’s <a className="underlined" href="https://github.com/O-C-R/floodwatch-extension" target="_blank">open source</a>.</li>
              <li>We vet our researchers, and will make the list of approved researchers publicly available.</li>
              <li>We’ll never sell your data to third parties or advertisers (obviously).</li>
              <li>You can delete your account whenever you want. </li>
            </ul>
            <p>Still have questions? Send them to <a href="mailto:floodwatch@ocr.nyc" className="underlined" target="_top">floodwatch@ocr.nyc</a>.</p>


            <h4 className="header"><a name="adinfo">What ad information do you collect?</a></h4>
            <p>When you go to a webpage, Floodwatch looks at all the images on that page. It then tries to make a guess at which of these images are ads.</p>


            <h4 className="header"><a name="browsing">Wait, so if you see my browsing, can you see my bank account/social media/personal email, etc.?</a></h4>
            <p>Nope! Floodwatch very deliberately tries to avoid collecting this info in a few ways:</p>
            <ul>
              <li>We only take a look at certain HTML tags, specifically image ones. No data from forms, or any text-based information, will be collected.</li> 
              <li>We only show images of ads if they’ve been seen by a minimum number of other people besides you. That means any ads or images that could potentially be specific to or identify you will be stripped out automatically.</li>
            </ul>
            <p>The public release of Floodwatch will include a blacklist, which will allow users to list specific sites that they don’t want Floodwatch to run on at all. </p>


            <h4 className="header"><a name="visibility">How do you use my information? Who can see it?</a></h4>
            <p>User information is expressed in two ways in Floodwatch: data from individual user accounts, and data from user accounts that have been aggregated together (based on demographics).</p>
            <p>Individual user entries are only ever accessible by the researchers that we have vetted. This is so they can do their own aggregation and analysis to find trends and patterns in advertising practices. No other Floodwatch users or outside viewers are able to see your individual data.</p>
            <p>Aggregated ad data is only accessible to logged-in users and researchers, and can only be viewed along demographic lines (e.g. the ad breakdown for the average woman Floodwatch user). Further, this aggregation is only visible if we have sufficient users of that demographic. If you fall into a very small demographic, we won’t show your data even in aggregation until we have sufficient other users like you to mask your ad signature.</p>
            <p>Floodwatch will never give your data to advertisers, nor sell your data or the platform itself to any third party.</p>


            <h4 className="header"><a name="export">Can I see my records?</a></h4>
            <p>Sure! For now, email us at <a href="mailto:floodwatch@ocr.nyc" className="underlined" target="_top">floodwatch@ocr.nyc</a>.</p>


            <h4 className="header"><a name="delete">Can I delete my records?</a></h4>
            <p>Anytime! For now, email us at <a href="mailto:floodwatch@ocr.nyc" className="underlined" target="_top">floodwatch@ocr.nyc</a>.</p>


            <h4 className="header"><a name="policychanges">Changes to policy</a></h4>
            <p>There is a possibility that we might need to adapt our Privacy Policy in the future, to clarify or modify it in response to our needs and your feedback. Please check the <a className="underlined" href="#faq">FAQ</a> periodically for changes. We will still do our best to notify you of any major changes to our policy, and your continued use of Floodwatch will mean you accept them.</p>

          </Col>
        </Row>
      </div>
    );
  }
}
