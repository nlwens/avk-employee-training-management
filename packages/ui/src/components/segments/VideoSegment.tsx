interface VideoSegmentProps {
  url: string;
  mimetype: string;
}

const VideoSegment = ({ url, mimetype }: VideoSegmentProps) => {
  return (
    <video controls className="w-full">
      <source src={url} type={mimetype} />
    </video>
  );
};

export default VideoSegment;
