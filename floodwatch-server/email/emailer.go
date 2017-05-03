package email

import (
	"bytes"
	"fmt"
	html "html/template"
	text "text/template"

	"github.com/aws/aws-sdk-go/aws"
	awsSession "github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"

	"github.com/O-C-R/auth/id"
)

type Email struct {
	Recipients  []string
	SourceEmail string
	Subject     string
	BodyHTML    string
	BodyText    string
}

var (
	resetPasswordSubjectTemplate  *text.Template
	resetPasswordBodyTextTemplate *text.Template
	resetPasswordBodyHTMLTemplate *html.Template
)

func init() {
	var err error
	resetPasswordSubjectTemplate, err = text.ParseFiles("templates/reset_password_subject.txt")
	if err != nil {
		panic(err)
	}

	resetPasswordBodyTextTemplate, err = text.ParseFiles("templates/reset_password.txt")
	if err != nil {
		panic(err)
	}

	resetPasswordBodyHTMLTemplate, err = html.ParseFiles("templates/reset_password.html")
	if err != nil {
		panic(err)
	}
}

type Emailer interface {
	SendResetPassword(email string, resetToken id.ID) error
	SendEmail(email *Email) error
}

type AWSSESEmailer struct {
	client      *ses.SES
	hostname    string
	sourceEmail string
}

func NewAWSSESEmailer(session *awsSession.Session, hostname, sourceEmail string) *AWSSESEmailer {
	sesClient := ses.New(session)

	return &AWSSESEmailer{
		client:      sesClient,
		hostname:    hostname,
		sourceEmail: sourceEmail,
	}
}

func (e *AWSSESEmailer) SendResetPassword(email string, resetToken id.ID) error {
	url := fmt.Sprintf("%s/reset_password?token=%s", e.hostname, resetToken.String())
	config := map[string]string{
		"resetPasswordUrl": url,
	}

	subjectBuffer := bytes.NewBuffer([]byte{})
	if err := resetPasswordSubjectTemplate.Execute(subjectBuffer, config); err != nil {
		return err
	}

	bodyTextBuffer := bytes.NewBuffer([]byte{})
	if err := resetPasswordBodyTextTemplate.Execute(bodyTextBuffer, config); err != nil {
		return err
	}

	bodyHTMLBuffer := bytes.NewBuffer([]byte{})
	if err := resetPasswordBodyHTMLTemplate.Execute(bodyHTMLBuffer, config); err != nil {
		return err
	}

	sendEmailInput := &Email{
		Recipients:  []string{email},
		SourceEmail: e.sourceEmail,
		Subject:     subjectBuffer.String(),
		BodyText:    bodyTextBuffer.String(),
		BodyHTML:    bodyHTMLBuffer.String(),
	}

	return e.SendEmail(sendEmailInput)
}

func (e *AWSSESEmailer) SendEmail(email *Email) error {
	awsRecipients := make([]*string, len(email.Recipients))
	for i, v := range email.Recipients {
		awsRecipients[i] = aws.String(v)
	}

	params := &ses.SendEmailInput{
		Destination: &ses.Destination{
			ToAddresses: awsRecipients,
		},
		Message: &ses.Message{
			Body: &ses.Body{
				Text: &ses.Content{
					Data:    aws.String(email.BodyText),
					Charset: aws.String("utf8"),
				},
				Html: &ses.Content{
					Data:    aws.String(email.BodyHTML),
					Charset: aws.String("utf8"),
				},
			},
			Subject: &ses.Content{
				Data:    aws.String(email.Subject),
				Charset: aws.String("utf8"),
			},
		},
		Source: aws.String(email.SourceEmail),
		ReplyToAddresses: []*string{
			aws.String(email.SourceEmail),
		},
		ReturnPath: aws.String(email.SourceEmail),
	}

	_, err := e.client.SendEmail(params)
	if err != nil {
		return err
	}

	return nil
}
